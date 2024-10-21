import {
    AddProductInfoProps,
    DbProductRecord,
    NotFoundCause,
    ProductRecord,
    queryProductPageQueue,
    QueryQueue,
    Shop,
    uuid,
  } from "@dipmaxtech/clr-pkg";
  import {
    defaultAznDealTask,
    defaultQuery,
  } from "../../constants.js";
  import {
    updateProductWithQuery,
  } from "../../db/util/crudProducts.js";
  import {
    handleAznListingNotFound,
    handleAznListingProductInfo,
  } from "../../util/scrapeAznListingsHelper.js";
  import { NegDealsOnAznStats } from "../../types/taskStats/NegDealsOnAzn.js";
  import { TaskStats } from "../../types/taskStats/TasksStats.js";
  import { log } from "../../util/logger.js";

  export async function scrapeAznListings(
    queue: QueryQueue,
    azn: Shop,
    source: Shop,
    targetLink: string,
    product: DbProductRecord,
    infos: TaskStats,
    processProps = defaultAznDealTask
  ) {
    return new Promise((res, rej) => {
      const { taskIdProp } = processProps;
      const { d , proxyType} = azn;
      const { d: shopDomain } = source;
      const { _id, s_hash } = product;
      const addProduct = async (product: ProductRecord) => {};
      const addProductInfo = async ({
        productInfo,
        url,
      }: AddProductInfoProps) => {
        await handleAznListingProductInfo(
          shopDomain,
          product,
          { productInfo, url },
          infos as NegDealsOnAznStats,
          queue,
          processProps
        );
        res("done");
      };
      const handleNotFound = async (cause: NotFoundCause) => {
        infos.notFound++;
        infos.total++;
        queue.total++;
        if (cause === "exceedsLimit") {
          const result = await updateProductWithQuery( _id, {
            $unset: {
              [taskIdProp]: "",
            },
          });
          log(`ExceedsLimit: ${shopDomain}-${_id}`, result);
        } else {
          await handleAznListingNotFound(shopDomain, _id);
        }
        res("done");
      };
  
      queue.pushTask(queryProductPageQueue, {
        retries: 0,
        shop: azn,
        proxyType,
        s_hash,
        requestId: uuid(),
        addProduct,
        onNotFound: handleNotFound,
        addProductInfo,
        queue,
        query: defaultQuery,
        prio: 0,
        extendedLookUp: false,
        pageInfo: {
          link: targetLink,
          name: d,
        },
      });
    });
  }
  