import {
  countProducts,
  findProducts,
  updateArbispotterProduct,
} from "../src/db/util/crudArbispotterProduct.js";
import { calculateOnlyArbitrage, safeParsePrice } from "@dipmaxtech/clr-pkg";
import { getActiveShops } from "../src/db/util/shops.js";
const chunksize = 9;

const cleansingProducts = async () => {
  const activeShops = await getActiveShops();
  const result = await Promise.all(
    activeShops.map(async (shop) => {
      const shopDomain = shop.d;
      const count = await countProducts(shopDomain, {
        $or: [
          { a_prc: { $type: ["string"] } },
          { e_prc: { $type: ["string"] } },
        ],
      });
      if (count === 0)
        return console.log(`No products to cleanse for ${shopDomain}`);
      const pages = Math.ceil(count / chunksize);
      for (let i = 0; i < pages; i++) {
        setTimeout(async () => {
          const products = await findProducts(
            shopDomain,
            {
                $or: [
                    { a_prc: { $type: ["string"] } },
                    { e_prc: { $type: ["string"] } },
                ],
            },
            chunksize,
            i
        );
        
        for (let index = 0; index < products.length; index++) {
            const pro = products[index];
            const price = safeParsePrice(pro.prc);
            const update = {};
            
            const aParsedPrice = safeParsePrice(pro.a_prc);
            const eParsedPrice = safeParsePrice(pro.e_prc);
            console.log('eParsedPrice:', eParsedPrice)
            console.log('aParsedPrice:', aParsedPrice)
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
              update["a_prc"] = aParsedPrice;
              update["a_mrgn"] = 0;
              update["a_mrgn_pct"] = 0;
            }
            if (price === 0 && eParsedPrice !== 0) {
              update["e_prc"] = eParsedPrice;
              update["e_mrgn"] = 0;
              update["e_mrgn_pct"] = 0;
            }

            if (aParsedPrice === 0) {
              update["a_prc"] = 0;
              update["a_mrgn"] = 0;
              update["a_mrgn_pct"] = 0;
            }
            if (eParsedPrice === 0) {
              update["e_prc"] = 0;
              update["e_mrgn"] = 0;
              update["e_mrgn_pct"] = 0;
            }
            setTimeout(async () => {
              await updateArbispotterProduct(shopDomain, pro.lnk, update);
            }, index * 500);
          }
        }, i * 1000);
      }
    })
  );

  if (result) {
    console.log("Cleansing completed");
  }
};

cleansingProducts().then();
