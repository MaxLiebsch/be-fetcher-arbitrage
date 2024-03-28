import {
  QueryQueue,
  addBestMatchToProduct,
  getManufacturer,
  getPrice,
  getProductCandidates,
  getProductNameSplitAdv,
  prefixLink,
  queryShopClean,
  queryURLBuilder,
} from "@dipmaxtech/clr-pkg";
import _ from "underscore";
import parsePrice from "parse-price";
import {
  ProductLimitReachedStatus,
  TaskCompletedStatus,
  TimeLimitReachedStatus,
} from "./status.js";
import {
  createArbispotterCollection,
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

export default async function (task) {
  return new Promise(async (resolve, reject) => {
    await createArbispotterCollection(task.shopDomain);
    const { shopDomain, type: taskType, productLimit } = task;
    const rawproducts = await lockProducts(shopDomain, productLimit);
    let crawledPages = 0;

    if (!rawproducts.length)
      return reject(
        new MissingProductsError(`No products for ${shopDomain}`, task)
      );

    if (productLimit > 0) {
      PRODUCT_LIMIT = productLimit;
    }
    const startTime = Date.now();

    const targetShopDomains = [
      { prefix: "e_", d: "ebay.de" },
      { prefix: "a_", d: "amazon.de" },
    ];

    const shops = await getShops(["ebay.de", "amazon.de"]);

    if (shops === null) return reject(new MissingShopError("", task));

    const babapromiseArr = [];
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
        crawledPages
      };
      if (matchedProducts.length >= PRODUCT_LIMIT) {
        clearInterval(interval);
        await queue.disconnect();
        throw new TaskCompletedStatus("PRODUCT_LIMIT_REACHED", task, progress);
      }
      if (elapsedTime > MATCH_TIME_LIMIT) {
        clearInterval(interval);
        await queue.disconnect();
        throw new TimeLimitReachedStatus("", task, progress);
      }
      if (queue.workload() === 0) {
        clearInterval(interval);
        await queue.disconnect();
        throw new TaskCompletedStatus("", task, progress);
      }
    };

    const queue = new QueryQueue(CONCURRENCY, proxyAuth);
    await queue.connect();
    let done = 0;

    const shuffled = _.shuffle(rawproducts);

    const sliced = shuffled;

    for (let index = 0; index < sliced.length; index++) {
      const product = sliced[index];
      const {
        name: nm,
        description: dscrptn,
        category: ctgry,
        nameSub: nmSub,
        price: prc,
        image: img,
        link: lnk,
        createdAt,
        updatedAt,
        shop: s,
      } = product;

      const mnfctr = getManufacturer(nm);
      const dscrptnSplit = getProductNameSplitAdv(product.description);
      const nmSubSplit = [];
      let result = {
        s,
        ean: "",
        pblsh: false,
        vrfd: false,
        ctgry,
        mnfctr: mnfctr.manufacturer,
        nm: mnfctr.name,
        e_prc: 0,
        a_prc: 0,
        img: prefixLink(img, s),
        lnk: prefixLink(lnk, s),
        prc: parsePrice(getPrice(prc ?? 0)),
        createdAt,
        updatedAt,
      };
      const query = {
        product: {
          key: nm.replaceAll(/[\\(\\)]/g, ""),
          value: nm.replaceAll(/[\\(\\)]/g, ""),
        },
        category: "default",
      };

      const _shops = targetShopDomains.map(
        (targetShop) =>
          new Promise((res, rej) => {
            const products = [];
            const addProduct = async (product) => {
              products.push(product);
            };
            const isFinished = () => res({ products, targetShop });

            const shop = shops[targetShop.d];
            queue.pushTask(queryShopClean, {
              retries: 0,
              shop,
              addProduct,
              query,
              prio: 0,
              isFinished,
              pageInfo: {
                link: shop.queryUrlSchema.length
                  ? queryURLBuilder(shop.queryUrlSchema, query).url
                  : shop.entryPoint,
                name: shop.d,
              },
            });
          })
      );

      babapromiseArr.push(
        Promise.all(_shops).then(async (res) => {
          const _candidates = {
            "ebay.de": [],
            "amazon.de": [],
          };
          res.forEach(({ products, targetShop }) => {
            if (products && products.length) {
              const { nm, prc, mnfctr } = result;
              const candidates = getProductCandidates(
                products.filter((p) => p.price !== "")
              );
              _candidates[targetShop.d] = candidates.map((candidate) => {
                return {
                  nm: candidate.name,
                  lnk: candidate.link,
                  split: candidate.candidateNameSplit,
                  prc: parsePrice(getPrice(candidate.price)),
                };
              });
              const arbitrage = addBestMatchToProduct(candidates, targetShop, {
                nm,
                nmSubSplit,
                prc,
                dscrptnSplit,
                mnfctr,
              });
              result = { ...result, ...arbitrage };
            }
          });
          done += 1;
          console.table(
            res.reduce((table, { products, targetShop }) => {
              table[targetShop.d] = {
                cnt: products.length,
                prc: targetShop.d.includes("amazon")
                  ? result.a_prc
                  : result.e_prc,
                nm: result.a_nm,
              };
              return table;
            }, {})
          );
          await upsertProduct(shopDomain, result);
          await updateCrawledProduct(shopDomain, product.name, {
            matched: true,
            nmSubSplit,
            dscrptnSplit,
            matchedAt: new Date().toISOString(),
            mnfctr: result.mnfctr,
            _candidates,
          });
          matchedProducts.push(result);
          return result;
        })
      );
    }
    await Promise.all(babapromiseArr);
  });
}
