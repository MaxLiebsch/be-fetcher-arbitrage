import {
  replaceAllHiddenCharacters,
  roundToTwoDecimals,
} from "@dipmaxtech/clr-pkg";
import { updateArbispotterProductQuery } from "../services/db/util/crudArbispotterProduct.js";
import { createHash } from "./hash.js";
import { UTCDate } from "@date-fns/utc";

export async function handleQueryEansOnEbyIsFinished(
  collection,
  queue,
  product,
  infos,
  foundProducts,
  task = null
) {
  const { ean, e_qty: sellQty, lnk: productLink } = product;
  infos.shops[collection]++;
  infos.total++;
  queue.total++;
  let productUpdate = {};
  const foundProduct = foundProducts.find((p) => p.link && p.price);
  if (foundProduct) {
    const { image, price, name, link } = foundProduct;
    const shortLink = foundProduct.link.split("?")[0];
    const esin = new URL(link).pathname.split("/")[2];

    productUpdate["e_img"] = image;
    productUpdate["e_lnk"] = shortLink;
    productUpdate["e_hash"] = createHash(shortLink);
    productUpdate["eanList"] = [ean];
    productUpdate["e_orgn"] = "e";
    productUpdate["e_pblsh"] = false;
    productUpdate["esin"] = esin;
    productUpdate["e_prc"] = price;
    productUpdate["e_nm"] = replaceAllHiddenCharacters(name);

    if (sellQty) {
      productUpdate["e_qty"] = sellQty;
      productUpdate["e_uprc"] = roundToTwoDecimals(price / sellQty);
    } else {
      productUpdate["e_qty"] = 1;
      productUpdate["e_uprc"] = price;
    }
    await updateArbispotterProductQuery(collection, productLink, {
      $set: {
        ...productUpdate,
        qEbyUpdatedAt: new UTCDate().toISOString(),
        eby_prop: "complete",
      },
      $unset: {
        eby_taskId: "",
      },
    });
    if (task) task.progress.lookupCategory.push(product._id);
  } else {
    await updateArbispotterProductQuery(collection, productLink, {
      $set: {
        eby_prop: "missing",
      },
      $unset: {
        eby_taskId: "",
      },
    });
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

  await updateArbispotterProductQuery(collection, productLink, {
    $set: {
      eby_prop: "missing",
    },
    $unset: {
      eby_taskId: "",
    },
  });
}
