import {
  replaceAllHiddenCharacters,
  roundToTwoDecimals,
} from "@dipmaxtech/clr-pkg";
import { updateArbispotterProductQuery } from "../db/util/crudArbispotterProduct.js";
import { createHash } from "./hash.js";
import { UTCDate } from "@date-fns/utc";
import { calculateMinMaxMedian } from "./calculateMinMaxMedian.js";
import { resetEbyProductQuery } from "../db/util/ebyQueries.js";

export async function handleQueryEansOnEbyIsFinished(
  collection,
  queue,
  product,
  infos,
  foundProducts,
  task = null
) {
  const { e_qty: sellQty, lnk: productLink } = product;
  infos.shops[collection]++;
  infos.total++;
  queue.total++;
  let update = {};
  const priceRange = calculateMinMaxMedian(foundProducts);
  const foundProduct = foundProducts.find(
    (p) =>
      p.link &&
      p.price &&
      p.price >= priceRange.min &&
      p.price <= priceRange.max
  );
  if (foundProduct) {
    const { image, price, name, link } = foundProduct;
    const shortLink = foundProduct.link.split("?")[0];
    const esin = new URL(link).pathname.split("/")[2];

    update["e_pRange"] = priceRange;
    update["e_img"] = image;
    update["e_lnk"] = shortLink;
    update["e_hash"] = createHash(shortLink);
    update["e_orgn"] = "e";
    update["e_pblsh"] = false;
    update["esin"] = esin;
    update["e_prc"] = price;
    update["e_nm"] = replaceAllHiddenCharacters(name);

    if (sellQty) {
      update["e_qty"] = sellQty;
      update["e_uprc"] = roundToTwoDecimals(price / sellQty);
    } else {
      update["e_qty"] = 1;
      update["e_uprc"] = price;
    }
    await updateArbispotterProductQuery(collection, productLink, {
      $set: {
        ...update,
        qEbyUpdatedAt: new UTCDate().toISOString(),
        eby_prop: "complete",
      },
      $unset: {
        eby_taskId: "",
      },
    });
    if (task) task.progress.lookupCategory.push(product._id);
  } else {
    await updateArbispotterProductQuery(
      collection,
      productLink,
      resetEbyProductQuery({ eby_prop: "missing", cat_prop: "" })
    );
  }
}

export async function handleQueryEansOnEbyNotFound(
  collection,
  infos,
  product,
  queue
) {
  const { lnk: productLink } = product;
  infos.notFound++;
  infos.shops[collection]++;
  infos.total++;
  queue.total++;

  await updateArbispotterProductQuery(
    collection,
    productLink,
    resetEbyProductQuery({ eby_prop: "missing", cat_prop: "" })
  );
}
