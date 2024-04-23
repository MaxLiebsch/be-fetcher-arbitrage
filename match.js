import {
  QueryQueue,
  getManufacturer,
  getPrice,
  segmentString,
  prefixLink,
  queryTargetShops,
  matchTargetShopProdsWithRawProd,
  targetRetailerList,
  reduceString,
  sleep,
} from "@dipmaxtech/clr-pkg";
import _ from "underscore";
import parsePrice from "parse-price";
import { TaskCompletedStatus, TimeLimitReachedStatus } from "./status.js";
import {
  createArbispotterCollection,
  findCrawledProductByName,
  getShops,
  lockProducts,
  unlockProduts,
  updateCrawledProduct,
  upsertProduct,
} from "./mongo.js";
import { handleResult } from "./handleResult.js";
import { MissingProductsError, MissingShopError } from "./errors.js";

const proxyAuth = {
  host: "127.0.0.1:8080",
  username: "",
  password: "",
};

const MATCH_TIME_LIMIT = 480;
let PRODUCT_LIMIT = 10000;
const CONCURRENCY = 4;

export default async function match(task) {
  return new Promise(async (resolve, reject) => {
    const { shopDomain, productLimit, startShops, test } = task;
    const collectionName = test ? `test.${shopDomain}` : shopDomain;
    await createArbispotterCollection(collectionName);

    //TODO: for testing
    // const rawProd = await findCrawledProductByName(
    //   "alternate.de",
    //   "Brother MFC-L2800DW, Multifunktionsdrucker"
    // );
    // if (!rawProd) throw new Error("Product not found");
    // const rawproducts = [rawProd];

    const rawproducts = await lockProducts(
      shopDomain,
      productLimit,
      task._id,
      task?.action
    );

    let crawledPages = 0;

    if (!rawproducts.length)
      return reject(
        new MissingProductsError(`No products for ${shopDomain}`, task)
      );

    if (productLimit > 0) {
      PRODUCT_LIMIT = productLimit;
    }
    const startTime = Date.now();

    let targetShops = targetRetailerList;

    if (startShops && startShops.length) {
      targetShops = [...targetShops, ...startShops];
    }

    const shops = await getShops(targetShops);

    if (shops === null) return reject(new MissingShopError("", task));

    const procProductsPromiseArr = [];
    const matchedProducts = [];

    const interval = setInterval(
      async () =>
        await checkProcess().catch(async (r) => {
          clearInterval(interval);
          await unlockProduts(shopDomain, rawproducts);
          handleResult(r, resolve, reject);
        }),
      20000
    );

    const checkProcess = async () => {
      if (queue.workload() > crawledPages) {
        crawledPages = queue.workload();
      }
      const endTime = Date.now();
      const elapsedTime = (endTime - startTime) / 1000 / 60 / 60;
      const progress = {
        products_cnt: matchedProducts.length,
        endTime: new Date().toISOString(),
        elapsedTime: `${elapsedTime.toFixed(2)} h`,
        crawledPages,
      };
      if (matchedProducts.length >= PRODUCT_LIMIT) {
        clearInterval(interval);
        await sleep(35000);
        await queue.clearQueue();
        throw new TaskCompletedStatus("PRODUCT_LIMIT_REACHED", task, progress);
      }
      if (elapsedTime > MATCH_TIME_LIMIT) {
        clearInterval(interval);
        await sleep(35000);
        await queue.clearQueue();
        throw new TimeLimitReachedStatus("", task, progress);
      }
      if (queue.workload() === 0) {
        clearInterval(interval);
        await sleep(35000);
        await queue.clearQueue();
        throw new TaskCompletedStatus("", task, progress);
      }
    };

    const queue = new QueryQueue(
      task?.concurrency ? task.concurrency : CONCURRENCY,
      proxyAuth,
      task
    );
    await queue.connect();
    let done = 0;

    const shuffled = _.shuffle(rawproducts);

    const sliced = shuffled;

    for (let index = 0; index < sliced.length; index++) {
      const rawProd = sliced[index];

      rawProd.name = rawProd.name.replaceAll(/[\\(\\)]/g, "");

      const {
        name: nm,
        description: dscrptn,
        category: ctgry,
        nameSub: nmSub,
        price: prc,
        promoPrice: prmPrc,
        image: img,
        link: lnk,
        createdAt,
        updatedAt,
        shop: s,
      } = rawProd;

      const { mnfctr, prodNm } = getManufacturer(nm);
      const dscrptnSegments = segmentString(dscrptn);
      const nmSubSegments = segmentString(nmSub);

      let procProd = {
        s,
        ean: "",
        arn: "",
        pblsh: false,
        vrfd: false,
        ctgry,
        mnfctr,
        nm: prodNm,
        e_prc: 0,
        a_prc: 0,
        img: prefixLink(img, s),
        lnk: prefixLink(lnk, s),
        prc: prmPrc
          ? parsePrice(getPrice(prmPrc ? prmPrc.replace(/\s+/g, "") : ""))
          : parsePrice(getPrice(prc ? prc.replace(/\s+/g, "") : "")),
        createdAt,
        updatedAt: new Date().toISOString(),
      };

      const reducedName = reduceString(nm, 55 + mnfctr.length);
      console.log("reducedName:", reducedName);

      const query = {
        product: {
          key: reducedName,
          value: reducedName,
        },
        category: "default",
      };
      const prodInfo = {
        procProd,
        rawProd,
        dscrptnSegments,
        nmSubSegments,
      };

      const _shops = await queryTargetShops(
        startShops ? startShops : targetShops,
        queue,
        shops,
        query,
        task,
        prodInfo
      );

      procProductsPromiseArr.push(
        Promise.all(_shops).then(async (targetShopProds) => {
          if (targetShopProds[0] && targetShopProds[0]?.procProd) {
            const procProd = targetShopProds[0]?.procProd;
            done += 1;
            await upsertProduct(collectionName, procProd);

            await updateCrawledProduct(shopDomain, rawProd.link, {
              matched: true,
              locked: false,
              dscrptnSegments,
              taskId: "",
              nmSubSegments,
              updatedAt: new Date().toISOString(),
              matchedAt: new Date().toISOString(),
              mnfctr,
              // candidates, TODO: provide candidates for statistics
            });
            matchedProducts.push(procProd);

            return procProd;
          } else {
            const { procProd, candidates } = matchTargetShopProdsWithRawProd(
              targetShopProds,
              prodInfo
            );
            done += 1;
            await upsertProduct(collectionName, procProd);

            await updateCrawledProduct(shopDomain, rawProd.link, {
              matched: true,
              locked: false,
              taskId: "",
              query: query.product.value,
              dscrptnSegments,
              nmSubSegments,
              updatedAt: new Date().toISOString(),
              matchedAt: new Date().toISOString(),
              mnfctr,
              candidates,
            });
            matchedProducts.push(procProd);
            return procProd;
          }
        })
      );
    }
    await Promise.all(procProductsPromiseArr);
  });
}

const task = {
  _id: "661a78dbc9c982a8567efac1",
  type: "LOOKUP_PRODUCTS",
  id: "lookup_shop_voelkner.de",
  shopDomain: "voelkner.de",
  productLimit: 20,
  executing: true,
  recurrent: true,
  completed: false,
  errored: false,
  startedAt: "2024-04-14T19:22:11.479Z",
  completedAt: "2024-04-14T14:12:23.386Z",
  createdAt: "2024-04-13T12:21:47.620Z",
  limit: {
    mainCategory: 0,
    subCategory: 0,
    pages: 0,
  },
  maintenance: false,
  lastCrawler: "love",
  reason: "COMPLETED",
  result: {
    products_cnt: 1000,
    endTime: "2024-04-14T14:12:22.735Z",
    elapsedTime: "1.11 h",
    crawledPages: 1992,
  },
  retry: 0,
  test: true,
  extendedLookUp: true,
  startShops: [
    {
      d: "idealo.de",
      prefix: "i_",
      name: "Idealo",
    },
  ],
};

// match(task).then();
