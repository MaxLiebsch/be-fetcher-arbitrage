import {
  Content,
  globalEventEmitter,
  NotFoundCause,
  ObjectId,
  Product,
  Query,
  queryEansOnEbyQueue,
  QueryQueue,
  queryURLBuilder,
  Shop,
  sleep,
  uuid,
} from '@dipmaxtech/clr-pkg';
import {
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  defaultQuery,
  MAX_EBY_MULTIPLE,
  proxyAuth,
  STANDARD_SETTLING_TIME,
} from '../../constants.js';
import { updateTask } from '../../db/util/tasks.js';
import {
  handleQueryEansOnEbyIsFinished,
  handleQueryEansOnEbyNotFound,
} from '../../util/queryEansOnEbyHelper.js';
import { DailySalesTask } from '../../types/tasks/DailySalesTask.js';
import { QueryEansOnEbyStats } from '../../types/taskStats/QueryEansOnEbyStats.js';
import { MultiStageReturnType } from '../../types/DailySalesReturnType.js';
import { WholeSaleEbyTask } from '../../types/tasks/Tasks.js';
import { TASK_TYPES } from '../../util/taskTypes.js';
import { updateWholesaleProgress } from '../../util/updateProgressInTasks.js';
import { log } from '../../util/logger.js';
import { getEanFromProduct } from '../../util/getEanFromProduct.js';
import { setupAllowedDomainsBasedOnShops } from '../../util/setupAllowedDomains.js';

export const queryEansOnEby = async (
  collection: string,
  ebay: Shop,
  task: DailySalesTask | WholeSaleEbyTask
): Promise<MultiStageReturnType> =>
  new Promise(async (res, rej) => {
    const { browserConfig, _id: taskId, shopDomain, id } = task;
    if ('currentStep' in task) task.currentStep = 'QUERY_EANS_EBY';
    const isWholeSaleEbyTask = task.type === TASK_TYPES.WHOLESALE_EBY_SEARCH;
    const { concurrency, productLimit } = browserConfig.queryEansOnEby;

    const queue = new QueryQueue(concurrency, proxyAuth, task);
    await setupAllowedDomainsBasedOnShops([ebay], task.type);
    queue.actualProductLimit = task.queryEansOnEby.length;
    await queue.connect();

    const eventEmitter = globalEventEmitter;

    let done = false;
    eventEmitter.on(
      `${queue.queueId}-finished`,
      async function queryEansOnEbyCallback() {
        if (done) return;
        done = true;
        log(`Settling time for Query eans on Eby ${id}...`);
        await sleep(STANDARD_SETTLING_TIME);
        interval && clearInterval(interval);
        if (isWholeSaleEbyTask) {
          await updateWholesaleProgress(taskId, 'WHOLESALE_EBY_SEARCH');
        } else {
          await updateTask(taskId, { $set: { progress: task.progress } });
        }
        await queue.disconnect(true);
        res({ infos, queueStats: queue.queueStats });
      }
    );

    const completedProducts: ObjectId[] = [];
    let interval = setInterval(async () => {
      if (isWholeSaleEbyTask) {
        await updateWholesaleProgress(taskId, 'WHOLESALE_EBY_SEARCH');
      } else {
        await updateTask(taskId, {
          $pull: {
            'progress.queryEansOnEby': { _id: { $in: completedProducts } },
          },
          $addToSet: {
            'progress.lookupCategory': { $each: task.progress.lookupCategory },
          },
        });
        await isProcessComplete();
      }
    }, DEFAULT_CHECK_PROGRESS_INTERVAL);

    let infos: QueryEansOnEbyStats = {
      total: 0,
      notFound: 0,
      locked: 0,
      shops: {
        [collection]: 0,
      },
      missingProperties: {
        [collection]: {
          ean: 0,
          image: 0,
        },
      },
      elapsedTime: '',
    };

    async function isProcessComplete() {
      if (infos.total === productLimit && !queue.idle()) {
        interval && clearInterval(interval);
        if (isWholeSaleEbyTask) {
          await updateWholesaleProgress(taskId, 'WHOLESALE_EBY_SEARCH');
        } else {
          await updateTask(taskId, { $set: { progress: task.progress } });
        }
        await queue.disconnect(true);
        res({ infos, queueStats: queue.queueStats });
      }
    }

    while (task.progress.queryEansOnEby.length) {
      const product = task.queryEansOnEby.pop();
      task.progress.queryEansOnEby.pop();

      if (!product) continue;

      const { s_hash, _id: productId } = product;

      const ean = getEanFromProduct(product);

      if (!ean) {
        completedProducts.push(productId);
        infos.missingProperties[collection].ean++;
        infos.total++;
        queue.total++;
        continue;
      }
      const foundProducts: Product[] = [];

      const addProduct = async (
        product: Partial<Record<Content, string | number | boolean | string[]>>
      ) => {
        foundProducts.push(product as Product);
      };
      const isFinished = async () => {
        completedProducts.push(productId);
        await handleQueryEansOnEbyIsFinished(
          collection,
          queue,
          product,
          infos,
          foundProducts,
          task
        );
        await isProcessComplete();
      };
      const handleNotFound = async (cause: NotFoundCause) => {
        completedProducts.push(productId);
        await handleQueryEansOnEbyNotFound(
          collection,
          product,
          isWholeSaleEbyTask
        );
        infos.notFound++;
        infos.shops[shopDomain]++;
        infos.total++;
        queue.total++;
        await isProcessComplete();
      };

      const query:Query = {
        ...defaultQuery,
        product: {
          value: ean,
          key: ean,
          price: Math.ceil(product.prc * MAX_EBY_MULTIPLE).toString()
        },
        category: 'total_listings',
      };

      if (!ebay.queryUrlSchema) {
        return rej(new Error('No queryUrlSchema found for ebay.de'));
      }
      const queryLink = queryURLBuilder(ebay.queryUrlSchema, query).url;
      queue.pushTask(queryEansOnEbyQueue, {
        retries: 0,
        requestId: uuid(),
        s_hash,
        shop: ebay,
        proxyType: ebay.proxyType,
        targetShop: {
          prefix: '',
          d: collection,
          name: collection,
        },
        addProduct,
        isFinished,
        onNotFound: handleNotFound,
        queue: queue,
        query,
        prio: 0,
        extendedLookUp: false,
        limit: undefined,
        pageInfo: {
          link: queryLink,
          name: ebay.d,
        },
      });
    }
  });
