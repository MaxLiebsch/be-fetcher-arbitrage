import {
  QueryQueue,
  lookupProductQueue,
  queryShopQueue,
  queryURLBuilder,
} from "@dipmaxtech/clr-pkg";
import _ from "underscore";
import { handleResult } from "../handleResult.js";
import { MissingProductsError, MissingShopError } from "../errors.js";
import { getShops } from "./db/util/shops.js";
import {
  CONCURRENCY,
  DEFAULT_CHECK_PROGRESS_INTERVAL,
  proxyAuth,
} from "../constants.js";
import { checkProgress } from "../util/checkProgress.js";
import {
  lockProducts,
  updateWholeSaleProduct,
} from "./db/util/crudWholeSaleSearch.js";

export default async function wholesale(task) {
  console.log("wholesale started... ", task.id, task?.action);
  return new Promise(async (resolve, reject) => {
    const { shopDomain, productLimit, limit, _id } = task;

    const targetShops = [
      { d: "idealo.de", prefix: "i_", name: "idealo" },
      { d: "amazon.de", prefix: "a_", name: "amazon" },
    ];
    const retailerTargetShop = { d: "amazon.de", prefix: "a_", name: "amazon" };

    const rawproducts = await lockProducts(productLimit, _id, task?.action);

    let done = 0;

    if (!rawproducts.length)
      return reject(
        new MissingProductsError(`No products for ${shopDomain}`, task)
      );

    const startTime = Date.now();

    const shops = await getShops(targetShops);

    if (shops === null) return reject(new MissingShopError("", task));

    const idealoShopInfo = shops["idealo.de"];
    const amazonShopInfo = shops["amazon.de"];

    const queue = new QueryQueue(
      task?.concurrency ? task.concurrency : CONCURRENCY,
      proxyAuth,
      task
    );
    await queue.connect();

    const procProductsPromiseArr = [];

    const interval = setInterval(
      async () =>
        await checkProgress({ queue, done, startTime, productLimit }).catch(
          async (r) => {
            clearInterval(interval);
            handleResult(r, resolve, reject);
          }
        ),
      DEFAULT_CHECK_PROGRESS_INTERVAL
    );
    for (let index = 0; index < rawproducts.length; index++) {
      const rawProd = rawproducts[index];

      const { name, ean, price, category, _id } = rawProd;

      const procProd = {
        nm: name,
        prc: price,
        mnfctr: "",
      };

      const prodInfo = {
        rawProd,
        procProd,
        dscrptnSegments: [],
        nmSubSegments: [],
      };

      const query = {
        product: {
          key: ean,
          value: ean,
        },
        category: "default",
      };

      //not needed, I swear I will write clean code
      const addProduct = async (product) => {};

      const isFinished = async (interm) => {
        done++;
        if (
          interm &&
          interm.intermProcProd.a_nm &&
          interm.intermProcProd.a_lnk
        ) {
          const intermProcProd = interm.intermProcProd;

          const handleNotFound = async () => {
            const prodInfo = {};
            Object.entries(intermProcProd).forEach(([key, value]) => {
              if (key.startsWith("a_")) {
                prodInfo[key] = value;
              }
            });
            await updateWholeSaleProduct(rawProd._id, {
              ...prodInfo,
              status: "complete",
              updatedAt: new Date().toISOString(),
              lookup_pending: false,
              locked: false,
              clrName: "",
            });

            if (done >= productLimit && !queue.idle()) {
              await checkProgress({
                queue,
                done,
                startTime,
                productLimit,
              }).catch(async (r) => {
                clearInterval(interval);
                handleResult(r, resolve, reject);
              });
            }
          };

          const addProductInfo = async ({ productInfo, url }) => {
            const prodInfo = {};
            prodInfo["a_lnk"] = url;
            if (productInfo) {
              const bsr = productInfo.find((info) => info.key === "bsr");
              const asin = productInfo.find((info) => info.key === "asin");
              const price = productInfo.find((info) => info.key === "a_prc");
              const img = productInfo.find((info) => info.key === "a_img");

              prodInfo["bsr"] = bsr?.value ?? [];
              prodInfo["asin"] = asin?.value ?? "";

              if (price && price > 0) {
                prodInfo["a_prc"] = price.value;
              } else {
                prodInfo["a_prc"] = intermProcProd.a_prc;
              }
              if (img) {
                prodInfo["a_img"] = img.value;
              }
              prodInfo["a_mrgn"] = intermProcProd.a_mrgn;
              prodInfo["a_mrgn_pct"] = intermProcProd.a_mrgn_pct;
              prodInfo["a_fat"] = intermProcProd.a_fat;
              prodInfo["a_nm"] = intermProcProd.a_nm;
              prodInfo["a_lnk"] = intermProcProd.a_lnk;
            } else {
              Object.entries(intermProcProd).forEach(([key, value]) => {
                if (key.startsWith("a_")) {
                  prodInfo[key] = value;
                }
              });
            }

            await updateWholeSaleProduct(rawProd._id, {
              ...prodInfo,
              status: "complete",
              updatedAt: new Date().toISOString(),
              lookup_pending: false,
              locked: false,
              clrName: "",
            });
          };

          queue.pushTask(lookupProductQueue, {
            retries: 0,
            shop: amazonShopInfo,
            addProduct,
            targetShop: retailerTargetShop,
            onNotFound: handleNotFound,
            addProductInfo,
            queue,
            query: {},
            prio: 0,
            extendedLookUp: false,
            limit: undefined,
            prodInfo: undefined,
            isFinished: undefined,
            pageInfo: {
              link: intermProcProd.a_lnk,
              name: amazonShopInfo.d,
            },
          });
        } else {
          await updateWholeSaleProduct(rawProd._id, {
            status: "not found",
            updatedAt: new Date().toISOString(),
            lookup_pending: false,
            locked: false,
            clrName: "",
          });
        }
      };

      queue.pushTask(queryShopQueue, {
        retries: 0,
        shop: idealoShopInfo,
        addProduct,
        queue,
        query,
        prio: 0,
        prodInfo,
        targetRetailerList: [retailerTargetShop],
        extendedLookUp: true,
        targetShop: retailerTargetShop,
        limit,
        isFinished,
        pageInfo: {
          link: idealoShopInfo.queryUrlSchema.length
            ? queryURLBuilder(idealoShopInfo.queryUrlSchema, query).url
            : idealoShopInfo.entryPoints[0].url,
          name: idealoShopInfo.d,
        },
      });
    }
    await Promise.all(procProductsPromiseArr);
  });
}
