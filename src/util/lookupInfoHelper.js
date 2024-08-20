import {
  generateUpdate,
  replaceAllHiddenCharacters,
} from "@dipmaxtech/clr-pkg";
import { resetAznProductQuery } from "../services/db/util/aznQueries.js";
import { updateArbispotterProductQuery } from "../services/db/util/crudArbispotterProduct.js";
import { upsertAsin } from "../services/db/util/asinTable.js";
import { UTCDate } from "@date-fns/utc";

export async function handleLookupInfoProductInfo(
  collection,
  hasEan,
  { productInfo, url },
  product,
  infos
) {
  const {
    prc: buyPrice,
    q_qty: sellQty,
    qty: buyQty,
    ean,
    lnk: productLink,
  } = product;
  if (productInfo) {
    const processedProductUpdate = generateUpdate(
      productInfo,
      buyPrice,
      sellQty || 1,
      buyQty || 1
    );
    const { costs, a_nm, asin } = processedProductUpdate;

    if (costs.azn > 0) {
      processedProductUpdate["a_nm"] = replaceAllHiddenCharacters(a_nm);
      processedProductUpdate["a_orgn"] = "a";
      processedProductUpdate["a_pblsh"] = true;
      if (hasEan) {
        await upsertAsin(asin, [ean], costs);
        processedProductUpdate["eanList"] = [ean];
      }

      await updateArbispotterProductQuery(collection, productLink, {
        $set: {
          ...processedProductUpdate,
          info_prop: "complete",
          aznUpdatedAt: new UTCDate().toISOString(),
          infoUpdatedAt: new UTCDate().toISOString(),
        },
        $unset: { info_taskId: "" },
      });
    } else {
      infos.missingProperties.costs++;
      await updateArbispotterProductQuery(collection, productLink, {
        $set: {
          info_prop: "missing",
          infoUpdatedAt: new UTCDate().toISOString(),
        },
        $unset: { info_taskId: "" },
      });
    }
  } else {
    infos.missingProperties.infos++;
    await updateArbispotterProductQuery(
      collection,
      productLink,
      resetAznProductQuery({
        info_prop: "missing",
        infoUpdatedAt: new UTCDate().toISOString(),
      })
    );
  }
}

export async function handleLookupInfoNotFound(collection, productLink) {
  const query = resetAznProductQuery({
    info_prop: "missing",
    infoUpdatedAt: new UTCDate().toISOString(),
  });
  await updateArbispotterProductQuery(collection, productLink, query);
}
