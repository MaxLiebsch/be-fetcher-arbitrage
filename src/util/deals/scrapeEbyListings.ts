import { AddProductInfoProps, DbProductRecord, NotFoundCause, ProductRecord, queryProductPageQueue, QueryQueue, Shop, uuid } from "@dipmaxtech/clr-pkg";
import { TaskStats } from "../../types/taskStats/TasksStats";
import { defaultEbyDealTask, defaultQuery } from "../../constants";
import { handleEbyListingNotFound, handleEbyListingProductInfo } from "../scrapeEbyListingsHelper";
import { DealsOnEbyStats } from "../../types/taskStats/DealsOnEbyStats";
import { updateProductWithQuery } from "../../db/util/crudProducts";
import { log } from "../logger";

export async function scrapeEbyListings(
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
    const addProduct = async (product: ProductRecord) => {};
    const addProductInfo = async ({
      productInfo,
      url,
    }: AddProductInfoProps) => {
      await handleEbyListingProductInfo(
        shopDomain,
        infos as DealsOnEbyStats,
        { productInfo, url },
        product,
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
        const result = await updateProductWithQuery(productId, {
          $unset: {
            [taskIdProp]: "",
          },
        });
        log(`Exceeds Limit: ${shopDomain}-${productId} - ${cause}`, result);
      } else {
        await handleEbyListingNotFound(shopDomain, productId);
      }
      res("done");
    };

    queue.pushTask(queryProductPageQueue, {
      retries: 0,
      shop: eby,
      addProduct,
      proxyType,
      s_hash,
      requestId: uuid(),
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
