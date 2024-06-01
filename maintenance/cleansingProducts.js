import {
  countProducts,
  findProducts,
  updateProduct,
} from "../src/services/db/util/crudArbispotterProduct.js";
import {
  calculateArbitrage,
  calculateOnlyArbitrage,
  safeParsePrice,
} from "@dipmaxtech/clr-pkg";
const chunksize = 9;

const cleansingProducts = async (shopDomain) => {
  const count = await countProducts(shopDomain, {
    $or: [{ a_prc: { $type: ["string"] } }, { e_prc: { $type: ["string"] } }],
  });

  const pages = Math.ceil(count / chunksize);
  for (let i = 0; i < pages; i++) {
    setTimeout(async () => {
      const products = await findProducts(
        shopDomain,
        { a_prc: { $type: ["string"] } },
        chunksize,
        i
      );

      for (let index = 0; index < products.length; index++) {
        const pro = products[index];
        const price = safeParsePrice(pro.prc);
        const update = {};

        const aParsedPrice = safeParsePrice(pro.a_prc);
        const eParsedPrice = safeParsePrice(pro.e_prc);
        if (aParsedPrice !== 0 && price !== 0) {
          const arbitrage = calculateOnlyArbitrage(price, aParsedPrice);
          Object.entries(arbitrage).forEach(([key, value]) => {
            update["a_" + key] = value;
          });
        }

        if (eParsedPrice !== 0 && price !== 0) {
          const arbitrage = calculateOnlyArbitrage(price, aParsedPrice);
          Object.entries(arbitrage).forEach(([key, value]) => {
            update["e_" + key] = value;
          });
        }

        if (price === 0 && aParsedPrice !== 0) {
          update["a_prc"] = eParsedPrice;
          update["a_mrgn"] = 0;
          update["a_mrgn_pct"] = 0;
        }
        if (price === 0 && eParsedPrice !== 0) {
          update["e_prc"] = eParsedPrice;
          update["e_mrgn"] = 0;
          update["e_mrgn_pct"] = 0;
        }

        setTimeout(async () => {
            await updateProduct(shopDomain, pro.lnk, update);
        }, index * 200);
      }
    }, i * 1000);
  }

  //   const products = await findProducts(shopDomain, {}, 20);
};

cleansingProducts("idealo.de").then();
