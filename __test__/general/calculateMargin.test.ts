import { calculateAznArbitrage, getAznAvgPrice } from "@dipmaxtech/clr-pkg";
import { describe, expect, test, beforeAll } from "@jest/globals";
//@ts-ignore
import { getArbispotterDb, getProductsCol } from "../../src/db/mongo.js";

describe("calculate arbitrage", () => {
  let product: null | any = null;
  let ean = "3035542004206";
  beforeAll(async () => {
    const col = await getProductsCol();
    product = await col.findOne({ eanList: ean, sdmn: 'idealo.de' }, { limit: 1 });
  }, 1000000);
  test("#1", () => {
    const expected = {
      a_mrgn: -7.35,
      a_mrgn_pct: -14.7,
    };
    const { a_prc: sellPrice, prc, qty, a_qty, nm, a_nm, costs, tax } = product;
    const {avgPrice, a_useCurrPrice }= getAznAvgPrice(product, sellPrice) 
    const weightedsellPrice = a_useCurrPrice ? sellPrice : avgPrice;
    const result = calculateAznArbitrage(
      prc * (a_qty / qty), // EK
      weightedsellPrice, // VK
      costs,
      tax
    );
    console.log("result:", result);
    console.log(
      JSON.stringify(
        {
          a_prc: sellPrice,
          a_useCurrPrice,
          weightedsellPrice,
          avgPrice,
          costs,
          prc,
          qty,
          a_qty,
          nm,
          a_nm,
        },
        null,
        2
      )
    );
    // Object.keys(result).forEach((key) => {
    //   expect(result[key]).toEqual(expected[key as keyof typeof expected]);
    // });
  });
});
