import {
  getManufacturer,
  globalEventEmitter,
  prefixLink,
  queryEansOnEbyQueue,
  QueryQueue,
  queryURLBuilder,
  replaceAllHiddenCharacters,
  roundToTwoDecimals,
  safeParsePrice,
} from "@dipmaxtech/clr-pkg";
import { DEFAULT_CHECK_PROGRESS_INTERVAL, defaultQuery, proxyAuth } from "../../constants.js";
import { createHash } from "../hash.js";
import { createOrUpdateArbispotterProduct } from "../../services/db/util/createOrUpdateArbispotterProduct.js";
import { salesDbName } from "../../services/productPriceComparator.js";
import { updateCrawlDataProduct } from "../../services/db/util/crudCrawlDataProduct.js";
import { updateTask } from "../../services/db/util/tasks.js";
import { findProductByLink } from "../../services/db/util/crudArbispotterProduct.js";

export const queryEansOnEby = async (ebay, task) =>
  new Promise(async (res, rej) => {
    const { browserConfig, _id, shopDomain } = task;
    const { concurrency, productLimit } = browserConfig.queryEansOnEby;
    
    task.actualProductLimit = task.queryEansOnEby.length;
    const queue = new QueryQueue(concurrency, proxyAuth, task);

    const eventEmitter = globalEventEmitter;

    eventEmitter.on(
      `${queue.queueId}-finished`,
      async function queryEansOnEbyCallback() {
        interval && clearInterval(interval);
        await updateTask(_id, { $set: { progress: task.progress } });
        await queue.disconnect(true);
        res(infos);
      }
    );

    const completedProducts = [];
    let interval = setInterval(async () => {
      await updateTask(_id, {
        $pull: {
          "progress.queryEansOnEby": { _id: { $in: completedProducts } },
        },
      });
    }, DEFAULT_CHECK_PROGRESS_INTERVAL);

    await queue.connect();
    let infos = {
      new: 0,
      total: 1,
      old: 0,
      notFound: 0,
      locked: 0,

      shops: {
        [shopDomain]: 0,
      },
      missingProperties: {
        [shopDomain]: {
          ean: 0,
          image: 0,
          hashes: [],
        },
      },
    };

    while (task.progress.queryEansOnEby.length) {
      const crawlDataProduct = task.queryEansOnEby.pop();
      task.progress.queryEansOnEby.pop();
      if (!crawlDataProduct) continue;

      const {
        name,
        category: ctgry,
        ean,
        hasMnfctr,
        mnfctr: manufacturer,
        price: prc,
        promoPrice: prmPrc,
        qty,
        uprc,
        image: img,
        link,
        shop: s,
      } = crawlDataProduct;

      const query = {
        ...defaultQuery,
        product: {
          value: ean,
          key: ean,
        },
        category: "default",
      };

      let mnfctr = "";
      let prodNm = "";

      if (hasMnfctr && manufacturer) {
        mnfctr = manufacturer;
        prodNm = name;
      } else {
        const { mnfctr: _mnfctr, prodNm: _prodNm } = getManufacturer(name);
        mnfctr = _mnfctr;
        prodNm = _prodNm;
      }

      let procProd = {
        ctgry,
        asin: "",
        mnfctr,
        nm: prodNm,
        img: prefixLink(img, s),
        lnk: prefixLink(link, s),
        s_hash: crawlDataProduct.s_hash,
        prc: prmPrc ? safeParsePrice(prmPrc) : safeParsePrice(prc),
        uprc,
        shop: shopDomain,
        qty,
      };

      const foundProducts = [];

      const addProduct = async (product) => {
        foundProducts.push(product);
      };
      const isFinished = async () => {
        completedProducts.push(crawlDataProduct._id);
        const arbispotterProductUpdate = {};
        infos.shops[shopDomain]++;
        infos.total++;
        queue.total++;
        const foundProduct = foundProducts.find((p) => p.link && p.price);
        if (foundProduct) {
          arbispotterProductUpdate["e_img"] = foundProduct.image;
          const shortLink = foundProduct.link.split("?")[0];
          arbispotterProductUpdate["e_lnk"] = shortLink;
          arbispotterProductUpdate["e_hash"] = createHash(shortLink);
          arbispotterProductUpdate["eanList"] = [ean];
          arbispotterProductUpdate["e_orgn"] = "e";
          arbispotterProductUpdate["e_pblsh"] = false;

          arbispotterProductUpdate["e_prc"] = foundProduct.price;
          arbispotterProductUpdate["e_nm"] = replaceAllHiddenCharacters(
            foundProduct.name
          );

          const e_qty = 1;
          if (e_qty) {
            arbispotterProductUpdate["e_qty"] = e_qty;
            arbispotterProductUpdate["e_uprc"] = roundToTwoDecimals(
              foundProduct.price / e_qty
            );
          } else {
            arbispotterProductUpdate["e_qty"] = 1;
            arbispotterProductUpdate["e_uprc"] = foundProduct.price;
          }

          const esin = new URL(foundProduct.link).pathname.split("/")[2];
          arbispotterProductUpdate["esin"] = esin;

          const crawlDataProductUpdate = {
            eby_locked: false,
            qty_prop: "",
            e_qty: arbispotterProductUpdate["e_qty"],
            eby_taskId: "",
            esin,
            eby_prop: "complete",
          };

          await updateCrawlDataProduct(
            salesDbName,
            link,
            crawlDataProductUpdate
          );
          const existingProduct = await findProductByLink(
            salesDbName,
            crawlDataProduct.link
          );
          if (existingProduct) {
            if (!existingProduct.bsr) {
              procProd["bsr"] = [];
            }
            const updatedProduct = { ...procProd, ...arbispotterProductUpdate };
            await createOrUpdateArbispotterProduct(salesDbName, updatedProduct);
            task.progress.lookupCategory.push(crawlDataProduct._id);
          } else {
            procProd["bsr"] = [];
            const updatedProduct = { ...procProd, ...arbispotterProductUpdate };
            const result = await createOrUpdateArbispotterProduct(
              salesDbName,
              updatedProduct
            );
            if (result.acknowledged) {
              if (result.upsertedId) {
                task.progress.lookupCategory.push(crawlDataProduct._id);
                infos.new++;
              } else infos.old++;
            } else {
              infos.failedSave++;
            }
          }
        } else {
          await updateCrawlDataProduct(salesDbName, link, {
            eby_locked: false,
            eby_prop: "missing",
            eby_taskId: "",
          });
        }
        if (infos.total === productLimit && !queue.idle()) {
          interval && clearInterval(interval);
          await updateTask(_id, { $set: { progress: task.progress } });
          await queue.disconnect(true);
          res(infos);
        }
      };
      const handleNotFound = async () => {
        completedProducts.push(crawlDataProduct._id);
        infos.notFound++;
        infos.shops[shopDomain]++;
        infos.total++;
        queue.total++;

        await updateCrawlDataProduct(salesDbName, link, {
          eby_locked: false,
          eby_prop: "missing",
          eby_taskId: "",
        });

        if (infos.total === productLimit && !queue.idle()) {
          interval && clearInterval(interval);
          await updateTask(_id, { $set: { progress: task.progress } });
          await queue.disconnect(true);
          res(infos);
        }
      };

      const queryLink = queryURLBuilder(ebay.queryUrlSchema, query).url;

      queue.pushTask(queryEansOnEbyQueue, {
        retries: 0,
        shop: ebay,
        targetShop: {
          prefix: "",
          d: shopDomain,
          name: shopDomain,
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
