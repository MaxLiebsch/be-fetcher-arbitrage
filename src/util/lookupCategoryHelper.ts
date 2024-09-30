import {
  AddProductInfoProps,
  calculateEbyArbitrage,
  DbProductRecord,
  detectCurrency,
  findMappedCategory,
  NotFoundCause,
  ObjectId,
  parseEbyCategories,
  QueryQueue,
  roundToTwoDecimals,
  resetEbyProductQuery,
  safeParsePrice,
} from "@dipmaxtech/clr-pkg";
import { UTCDate } from "@date-fns/utc";
import {
  deleteArbispotterProduct,
  moveArbispotterProduct,
  updateArbispotterProductQuery,
} from "../db/util/crudArbispotterProduct.js";
import { getEanFromProduct } from "./getEanFromProduct.js";
import { LookupCategoryStats } from "../types/taskStats/LookupCategoryStats.js";
import { log } from "./logger.js";
import { hostname } from "../db/mongo.js";
import { wholeSaleNotFoundQuery } from "./wholeSales.js";

export async function handleLookupCategoryProductInfo(
  collection: string,
  hasEan: boolean,
  { productInfo, url }: AddProductInfoProps,
  queue: QueryQueue,
  infos: LookupCategoryStats,
  product: DbProductRecord,
  isWholeSaleEbyTask?: boolean
) {
  infos.total++;
  queue.total++;
  const { _id: productId } = product;

  const exisitingEan = getEanFromProduct(product);

  if (productInfo) {
    const infoMap = new Map();
    productInfo.forEach((info) => infoMap.set(info.key, info.value));
    const ean = infoMap.get("ean");
    const ebyListingPrice = infoMap.get("e_prc");
    const categories = infoMap.get("categories");

    if (hasEan) {
      if (!ean) {
        const result = await updateArbispotterProductQuery(
          productId,
          isWholeSaleEbyTask
            ? wholeSaleNotFoundQuery
            : resetEbyProductQuery({ cat_prop: "ean_missing", eby_prop: "" })
        );
        log(`No ean: ${collection}-${productId}`, result);
      } else if (formatEan(ean) !== formatEan(exisitingEan)) {
        const result = await updateArbispotterProductQuery(
          productId,
          isWholeSaleEbyTask
            ? wholeSaleNotFoundQuery
            : resetEbyProductQuery({
                cat_prop: "ean_missmatch",
                eby_prop: "",
              })
        );
        log(`Ean missmatch: ${collection}-${productId}`, result);
      } else {
        await handleCategoryAndUpdate(
          collection,
          product,
          ebyListingPrice,
          categories,
          isWholeSaleEbyTask
        );
      }
    } else {
      await handleCategoryAndUpdate(
        collection,
        product,
        ebyListingPrice,
        categories,
        isWholeSaleEbyTask
      );
    }
  } else {
    const result = await updateArbispotterProductQuery(
      productId,
      isWholeSaleEbyTask
        ? wholeSaleNotFoundQuery
        : resetEbyProductQuery({ cat_prop: "missing", eby_prop: "" })
    );
    log(`No product info: ${collection}-${productId}`, result);
  }
}

export async function handleLookupCategoryNotFound(
  collection: string,
  infos: LookupCategoryStats,
  queue: QueryQueue,
  productId: ObjectId,
  cause: NotFoundCause,
  isWholeSaleEby?: boolean
) {
  infos.notFound++;
  infos.shops[collection]++;
  infos.total++;
  queue.total++;

  if (cause === "exceedsLimit") {
    const result = await updateArbispotterProductQuery(
      productId,
      isWholeSaleEby
        ? wholeSaleNotFoundQuery
        : {
            $set: {
              cat_prop: "timeout",
            },
            $unset: {
              cat_taskId: "",
            },
          }
    );
    log(`Exceeds limit: ${collection}-${productId}`, result);
  } else if (cause === "notFound") {
    const result = await deleteArbispotterProduct(productId);
    log(`Deleted: ${collection}-${productId}`, result);
  } else {
    !isWholeSaleEby &&
      (await moveArbispotterProduct( "grave", productId));

    log(`Moved to grave ${collection}-${productId} ${cause}`);
  }
}

function formatEan(ean: any): string {
  return ean.toString().trim().padStart(13, "0");
}

export const handleCategoryAndUpdate = async (
  shopDomain: string,
  product: DbProductRecord,
  ebyListingPrice: string,
  categories: string[],
  isWholeSaleEbyTask?: boolean
) => {
  const {
    esin,
    prc: buyPrice,
    e_qty: sellQty,
    qty: buyQty,
    e_vrfd,
    _id: productId,
  } = product;

  if (categories) {
    const sellPrice = safeParsePrice(ebyListingPrice || "0");
    const currency = detectCurrency(ebyListingPrice || "");
    const sellUnitPrice = roundToTwoDecimals(sellPrice / sellQty!);
    const parsedCategories = parseEbyCategories(categories); // [ 322323, 3223323, 122121  ]
    let mappedCategory = findMappedCategory(parsedCategories); // { category: "Drogerie", id: 322323, ...}

    if (mappedCategory) {
      let ebyArbitrage = calculateEbyArbitrage(
        mappedCategory,
        sellPrice,
        buyPrice * (sellQty! / buyQty)
      );
      const productUpdate = {
        ...ebyArbitrage,
        ...(currency && { e_cur: currency }),
        ...(!e_vrfd && {
          e_vrfd: {
            vrfd: false,
            vrfn_pending: true,
            flags: [],
            flag_cnt: 0,
          },
        }),
        cat_prop: "complete",
        catUpdatedAt: new UTCDate().toISOString(),
        e_prc: sellPrice,
        e_uprc: sellUnitPrice,
        ebyUpdatedAt: new UTCDate().toISOString(),
        ebyCategories: [
          {
            id: mappedCategory.id,
            createdAt: new UTCDate().toISOString(),
            category: mappedCategory.category,
          },
        ],
        e_pblsh: true,
        esin,
      };
      let query = {};
      if (isWholeSaleEbyTask) {
        query = {
          $set: {
            e_status: "complete",
            e_lookup_pending: false,
            ...productUpdate,
          },
          $unset: { e_locked: "" },
          $pull: { clrName: hostname },
        };
      } else {
        query = {
          $set: { ...productUpdate },
          $unset: { cat_taskId: "" },
        };
      }
      const result = await updateArbispotterProductQuery(productId, query);
      log(`Updated: ${shopDomain}-${productId}`, result);
    } else {
      const result = await updateArbispotterProductQuery(
        productId,
        isWholeSaleEbyTask
          ? wholeSaleNotFoundQuery
          : resetEbyProductQuery({
              cat_prop: "category_not_found",
              eby_prop: "",
            })
      );

      log(`Category mapping failed: ${shopDomain}-${productId}`, result);
    }
  } else {
    const result = await updateArbispotterProductQuery(
      productId,
      isWholeSaleEbyTask
        ? wholeSaleNotFoundQuery
        : resetEbyProductQuery({ cat_prop: "categories_missing", eby_prop: "" })
    );
    log(`No categories parsed: ${shopDomain}-${productId}`, result);
  }
};
