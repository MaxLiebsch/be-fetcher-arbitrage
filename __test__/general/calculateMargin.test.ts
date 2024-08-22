import { calculateAznArbitrage } from "@dipmaxtech/clr-pkg";
import { describe, expect, test, beforeAll } from "@jest/globals";
//@ts-ignore
import { getArbispotterDb } from "../../src/services/db/mongo.js";

describe("calculate arbitrage", () => {
  let product: null | any = null;
  let ean = "4008239216434";
  beforeAll(async () => {
    const db = await getArbispotterDb();
    const shopDomain = "fressnapf.de";
    const col = db.collection(shopDomain);
    product = await col.findOne({ eanList: ean }, { limit: 1 });
  }, 1000000);
  test("#1", () => {
    const expected = {
      a_mrgn: -7.35,
      a_mrgn_pct: -14.7,
    };
    const { a_prc, prc, qty, a_qty, nm, a_nm, costs, tax } = product;
    const result = calculateAznArbitrage(
      prc * (a_qty / qty), // EK
      a_prc, // VK
      costs,
      tax
    );
    console.log("result:", result);
    console.log(
      JSON.stringify(
        {
          a_prc,
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
