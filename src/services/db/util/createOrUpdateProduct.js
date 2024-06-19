import { proxies } from "@dipmaxtech/clr-pkg";
import { createHash, verifyHash } from "../../../util/hash.js";
import {
  findProductByLink,
  updateProduct,
  upsertProduct,
} from "./crudArbispotterProduct.js";

export const createOrUpdateProduct = async (domain, procProd, infoCb) => {
  let isNewProduct = true;
  const product = await findProductByLink(domain, procProd.lnk);

  if (product) {
    isNewProduct = false;
    if (procProd.a_lnk) {
      if (!verifyHash(procProd.a_lnk, product.a_hash)) {
        procProd.a_props = "incomplete";
        procProd.bsr = [];
        // Remove keepa properties
        const keepaProperties = [
          { name: "categories" },
          { name: "k_eanList" },
          { name: "brand" },
          { name: "numberOfItems" },
          { name: "availabilityAmazon" },
          { name: "categoryTree" },
          { name: "salesRanks" }, // Sales Rank nullable
          { name: "monthlySold" },
          { name: "ahstprcs" }, // Amazon history prices
          { name: "anhstprcs" }, // Amazon new history prices
          { name: "auhstprcs" }, // Amazon used history prices
          { name: "curr_ahsprcs" },
          { name: "curr_ansprcs" },
          { name: "curr_ausprcs" },
          { name: "curr_salesRank" },
          { name: "avg90_ahsprcs" }, // Average of the Amazon history prices of the last 90 days
          { name: "avg90_ansprcs" }, // Average of the Amazon history prices of the last 90 days
          { name: "avg90_ausprcs" }, // Average of the Amazon history prices of the last 90 days
          { name: "avg90_salesRank" }, // Average of the Amazon history prices of the last 90 days
          { name: "buyBoxIsAmazon" },
          { name: "stockAmount" }, //  The stock of the Amazon offer, if available. Otherwise undefined.
          { name: "stockBuyBox" }, // he stock of the buy box offer, if available. Otherwise undefined.
          { name: "totalOfferCount" }, // The total count of offers for this product (all conditions combined). The offer count per condition can be found in the current field.
        ];
        keepaProperties.forEach((prop) => {
          procProd[prop.name] = null;
        });
        procProd["keepaUpdatedAt"] = new Date(
          Date.now() - 1000 * 60 * 60 * 24 * 14
        ).toISOString();
        procProd.a_hash = createHash(procProd.a_lnk);
        procProd.a_vrfd = {
          vrfd: false,
          vrfn_pending: true,
          flags: [],
          flag_cnt: 0,
        };
      }
    }
    if (procProd.e_lnk) {
      if (!verifyHash(procProd.e_lnk, product.e_hash)) {
        procProd.e_hash = createHash(procProd.e_lnk);
        procProd.e_vrfd = {
          vrfd: false,
          vrfn_pending: true,
          flags: [],
          flag_cnt: 0,
        };
      }
    }

    if (
      product?.eanList &&
      product?.eanList.length > 0 &&
      procProd?.eanList &&
      procProd?.eanList.length > 0
    ) {
      let eanList = [...product.eanList, ...procProd.eanList];
      procProd.eanList = [...new Set(eanList)];
    }
    await updateProduct(domain, procProd.lnk, procProd);
  } else {
    const newProduct = {
      pblsh: false,
      a_vrfd: {
        vrfd: false,
        vrfn_pending: true,
        flags: [],
        flag_cnt: 0,
      },
      e_vrfd: {
        vrfd: false,
        vrfn_pending: true,
        flags: [],
        flag_cnt: 0,
      },
      lckd: false,
      taskId: "",
      a_props: "incomplete",
      ean: "",
      asin: "",
      bsr: [],
      ...procProd,
    };

    if (newProduct.a_lnk) {
      const a_hash = createHash(newProduct.a_lnk);
      newProduct.a_hash = a_hash;
    }

    if (newProduct.e_lnk) {
      const e_hash = createHash(newProduct.e_lnk);
      newProduct.e_hash = e_hash;
    }

    await upsertProduct(domain, newProduct);
  }
  infoCb(isNewProduct);
};
