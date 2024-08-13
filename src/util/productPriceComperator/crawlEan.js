import {
  globalEventEmitter,
  queryProductPageQueue,
  QueryQueue,
} from "@dipmaxtech/clr-pkg";
import { createOrUpdateCrawlDataProduct } from "../../services/db/util/createOrUpdateCrawlDataProduct.js";
import { updateCrawlDataProduct } from "../../services/db/util/crudCrawlDataProduct.js";
import { updateTask } from "../../services/db/util/tasks.js";
import { deleteProduct } from "../../services/db/util/crudCrawlDataProduct.js";
import { salesDbName } from "../../services/productPriceComparator.js";
import { createHash } from "../hash.js";
import {
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  defaultQuery,
  proxyAuth,
} from "../../constants.js";

export const crawlEans = async (shop, task) =>
  new Promise(async (res, rej) => {
    const { browserConfig, _id, shopDomain } = task;
    const { concurrency, productLimit } = browserConfig.crawlEan;
    let infos = {
      total: 1,
      notFound: 0,
      locked: 0,
      shops: {},
      missingProperties: {
        [shopDomain]: {
          ean: 0,
          image: 0,
          hashes: [],
        },
      },
    };

    task.actualProductLimit = task.crawlEan.length;
    const queue = new QueryQueue(concurrency, proxyAuth, task);
    const eventEmitter = globalEventEmitter;

    eventEmitter.on(
      `${queue.queueId}-finished`,
      async function crawlEanCallback() {
        await updateTask(_id, { $set: { progress: task.progress } });
        await queue.disconnect(true);
        res(infos);
      }
    );
    const completedProducts = [];
    let interval = setInterval(async () => {
      await updateTask(_id, {
        $pull: {
          "progress.crawlEan": { _id: { $in: completedProducts } },
        },
        $addToSet: {
          "progress.queryEansOnEby": { $each: task.progress.queryEansOnEby },
          "progress.lookupInfo": { $each: task.progress.lookupInfo },
        },
      });
    }, DEFAULT_CHECK_PROGRESS_INTERVAL);

    await queue.connect();
    while (task.progress.crawlEan.length) {
      task.progress.crawlEan.pop();
      const crawlDataProduct = task.crawlEan.pop();
      if (!crawlDataProduct) continue;
      let crawlDataProductLink = crawlDataProduct.link;

      const addProduct = async (product) => {};
      const addProductInfo = async ({ productInfo, url }) => {
        completedProducts.push(crawlDataProduct._id);
        infos.shops[shopDomain]++;
        infos.total++;
        queue.total++;
        if (productInfo) {
          const infoMap = new Map();
          productInfo.forEach((info) => infoMap.set(info.key, info.value));
          const crawlDataProductUpdate = {
            ean_locked: false,
            ean_taskId: "",
          };
          let ean = infoMap.get("ean");
          let isEan =
            ean &&
            /\b[0-9]{12,13}\b/.test(ean) &&
            !ean.toString().startsWith("99");

          if (ean && Number(ean) && ean.length === 11) {
            ean = "00" + ean;
            isEan = true;
          }

          const sku = infoMap.get("sku");
          const image = infoMap.get("image");
          const mku = infoMap.get("mku");
          if (url !== crawlDataProductLink) {
            await deleteProduct(salesDbName, crawlDataProductLink);
            crawlDataProductLink = url;
            crawlDataProductUpdate["link"] = url;
          }
          if (isEan) {
            crawlDataProductUpdate["ean"] = ean;
          }
          if (sku) {
            crawlDataProductUpdate["sku"] = sku;
          }
          if (image) {
            crawlDataProductUpdate["image"] = image;
          }
          if (mku) {
            crawlDataProductUpdate["mku"] = mku;
          }
          const properties = ["ean"];
          properties.forEach((prop) => {
            if (!crawlDataProductUpdate[prop]) {
              infos.missingProperties[shopDomain][prop]++;
            }
          });
          crawlDataProductUpdate["s_hash"] = createHash(crawlDataProductLink);
          if (isEan) {
            crawlDataProductUpdate["ean_prop"] = "found";
            task.progress.queryEansOnEby.push(crawlDataProduct._id);
            task.progress.lookupInfo.push(crawlDataProduct._id);
          } else {
            infos.missingProperties[shopDomain].hashes.push(
              // @ts-ignore
              crawlDataProductUpdate["s_hash"]
            );
            crawlDataProductUpdate["ean_prop"] = ean ? "invalid" : "missing";
          }
          delete crawlDataProduct._id;
          await createOrUpdateCrawlDataProduct(salesDbName, {
            ...crawlDataProduct,
            ...crawlDataProductUpdate,
          });
        } else {
          const crawlDataProductUpdate = {
            ean_locked: false,
            ean_prop: "missing",
            ean_taskId: "",
          };
          await updateCrawlDataProduct(
            salesDbName,
            crawlDataProductLink,
            crawlDataProductUpdate
          );
        }
        if (infos.total === productLimit && !queue.idle()) {
          console.log("product limit reached");
          interval && clearInterval(interval);
          await updateTask(_id, { $set: { progress: task.progress } });
          await queue.disconnect(true);
          res(infos);
        }
      };
      const handleNotFound = async (cause) => {
        completedProducts.push(crawlDataProduct._id);
        infos.notFound++;
        infos.total++;
        queue.total++;
        //marke dead
        if (infos.total === productLimit && !queue.idle()) {
          console.log("product limit reached");
          interval && clearInterval(interval);
          await updateTask(_id, { $set: { progress: task.progress } });
          await queue.disconnect(true);
          res(infos);
        }
      };

      queue.pushTask(queryProductPageQueue, {
        retries: 0,
        shop,
        addProduct,
        targetShop: {
          name: shopDomain,
          prefix: "",
          d: shopDomain,
        },
        onNotFound: handleNotFound,
        addProductInfo,
        queue: queue,
        query: defaultQuery,
        prio: 0,
        extendedLookUp: false,
        pageInfo: {
          link: crawlDataProductLink,
          name: shop.d,
        },
      });
    }
  });
