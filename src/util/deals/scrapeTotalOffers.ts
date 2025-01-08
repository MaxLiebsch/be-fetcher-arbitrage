import {
  AddProductInfoProps,
  Content,
  DbProductRecord,
  NotFoundCause,
  Product,
  ProductRecord,
  Query,
  queryEansOnEbyQueue,
  queryProductPageQueue,
  QueryQueue,
  queryURLBuilder,
  Shop,
  uuid,
} from '@dipmaxtech/clr-pkg';
import { TaskStats } from '../../types/taskStats/TasksStats.js';
import { defaultEbyDealTask, defaultQuery } from '../../constants.js';
import { handleEbyListingNotFound } from '../scrapeEbyListingsHelper.js';
import { updateProductWithQuery } from '../../db/util/crudProducts.js';
import { log } from '../logger.js';
import { getEanFromProduct } from '../getEanFromProduct.js';
import { handleScrapeTotalOffersIsFinished } from '../scrapeTotalOffersHelper.js';
import { handleQueryEansOnEbyNotFound } from '../queryEansOnEbyHelper.js';

export async function scrapeTotalOffers(
  queue: QueryQueue,
  eby: Shop,
  source: Shop,
  targetLink: string,
  product: DbProductRecord,
  infos: TaskStats,
  processProps = defaultEbyDealTask
) {
  return new Promise((res, rej) => {
    const { taskIdProp } = processProps;
    const { d, proxyType } = eby;
    const { d: shopDomain } = source;
    const { _id: productId, s_hash } = product;
    const foundProducts: Product[] = [];
    const addProduct = async (
      product: Partial<Record<Content, string | number | boolean | string[]>>
    ) => {
      foundProducts.push(product as Product);
    };
    const isFinished = async () => {
      await handleScrapeTotalOffersIsFinished({
        shopDomain,
        queue,
        product,
        infos,
        foundProducts,
        task: null,
        processProps,
      });
    };

    const handleNotFound = async (cause: NotFoundCause) => {
      infos.notFound++;
      infos.total++;
      queue.total++;
      if (cause === 'exceedsLimit' || cause === 'timeout') {
        const result = await updateProductWithQuery(productId, {
          $unset: {
            [taskIdProp]: '',
          },
        });
        log(`Exceeds Limit: ${shopDomain}-${productId} - ${cause}`, result);
      } else {
        await handleQueryEansOnEbyNotFound(shopDomain, product, false);
      }
      res('done');
    };

    const ean = getEanFromProduct(product);

    if (!ean) {
      return rej(new Error('EAN not found'));
    }

    const query: Query = {
      ...defaultQuery,
      product: {
        value: ean,
        key: ean,
      },
      category: 'total_listings',
    };

    if (!eby.queryUrlSchema) {
      return rej(new Error('No queryUrlSchema found for ebay.de'));
    }
    const queryLink = queryURLBuilder(eby.queryUrlSchema, query).url;

    queue.pushTask(queryEansOnEbyQueue, {
      retries: 0,
      requestId: uuid(),
      shop: eby,
      addProduct,
      proxyType,
      s_hash,
      onNotFound: handleNotFound,
      isFinished,
      queue,
      query,
      prio: 0,
      extendedLookUp: false,
      pageInfo: {
        link: queryLink,
        name: eby.d,
      },
    });
  });
}
