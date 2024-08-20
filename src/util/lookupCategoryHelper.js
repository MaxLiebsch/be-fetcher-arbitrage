import {
  calculateEbyArbitrage,
  findMappedCategory,
  parseEbyCategories,
  roundToTwoDecimals,
  safeParsePrice,
} from "@dipmaxtech/clr-pkg";
import {
  moveArbispotterProduct,
  updateArbispotterProductQuery,
} from "../services/db/util/crudArbispotterProduct.js";
import { resetEbyProductQuery } from "../services/db/util/ebyQueries.js";
import { UTCDate } from "@date-fns/utc";

export async function handleLookupCategoryProductInfo(
  collection,
  hasEan,
  { productInfo, url },
  queue,
  infos,
  product
) {
  infos.total++;
  queue.total++;
  const {ean: exisitingEan, lnk: productLink } = product;
  if (productInfo) {
    const infoMap = new Map();
    productInfo.forEach((info) => infoMap.set(info.key, info.value));
    const ean = infoMap.get("ean");
    const ebyListingPrice = infoMap.get("e_prc");
    const categories = infoMap.get("categories");

    if (hasEan) {
      if (!ean) {
        await updateArbispotterProductQuery(
          collection,
          productLink,
          resetEbyProductQuery({ cat_prop: "ean_missing", eby_prop: "" })
        );
      } else if (ean !== exisitingEan) {
        await updateArbispotterProductQuery(
          collection,
          productLink,
          resetEbyProductQuery({
            cat_prop: "ean_missmatch",
            eby_prop: "",
          })
        );
      } else {
        await handleCategoryAndUpdate(
          collection,
          product,
          ebyListingPrice,
          categories
        );
      }
    } else {
      await handleCategoryAndUpdate(
        collection,
        product,
        ebyListingPrice,
        categories
      );
    }
  } else {
    await updateArbispotterProductQuery(
      collection,
      productLink,
      resetEbyProductQuery({ cat_prop: "missing", eby_prop: "" })
    );
  }
}

export async function handleLookupCategoryNotFound(
  collection,
  infos,
  queue,
  productLink,
  cause
) {
  infos.notFound++;
  infos.shops[collection]++;
  infos.total++;
  queue.total++;
  if (cause === "timeout") {
    await updateArbispotterProductQuery(collection, productLink, {
      $set: {
        cat_prop: "timeout",
      },
      $unset: {
        cat_taskId: "",
      },
    });
  } else {
    await moveArbispotterProduct(collection, "grave", productLink);
  }
}

export const handleCategoryAndUpdate = async (
  shopDomain,
  product,
  ebyListingPrice,
  categories
) => {
  const {
    esin,
    price: buyPrice,
    e_qty: sellQty,
    qty: buyQty,
    lnk: productLink,
  } = product;

  if (categories) {
    const sellPrice = safeParsePrice(ebyListingPrice ?? "0");

    const sellUnitPrice = roundToTwoDecimals(sellPrice / sellQty);
    const parsedCategories = parseEbyCategories(categories); // [ 322323, 3223323, 122121  ]
    let mappedCategory = findMappedCategory(parsedCategories); // { category: "Drogerie", id: 322323, ...}

    if (mappedCategory) {
      let ebyArbitrage = calculateEbyArbitrage(
        mappedCategory,
        sellPrice,
        buyPrice * (sellQty / buyQty)
      );
      const productUpdate = {
        ...ebyArbitrage,
        cat_prop: "complete",
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
      await updateArbispotterProductQuery(shopDomain, productLink, {
        $set: productUpdate,
        $unset: { cat_taskId: "" },
      });
    } else {
      await updateArbispotterProductQuery(
        shopDomain,
        productLink,
        resetEbyProductQuery({ cat_prop: "category_not_found", eby_prop: "" })
      );
    }
  } else {
    await updateArbispotterProductQuery(
      shopDomain,
      productLink,
      resetEbyProductQuery({ cat_prop: "categories_missing", eby_prop: "" })
    );
  }
};
