import {
  calculateAznArbitrage,
  calculateEbyArbitrage,
  findMappedCategory,
} from "@dipmaxtech/clr-pkg";
//@ts-ignore
import { getArbispotterDb } from "../../src/db/mongo.js";
import { describe, expect, test, beforeAll } from "@jest/globals";


describe("calculate arbitrage", () => {
  let product: null | any= null;
  let ean = "8719514319141";
  beforeAll(async () => {
    const db = await getArbispotterDb();
    const shopDomain = "idealo.de";
    const col = db.collection(shopDomain);
    product = await col.findOne({ eanList: ean }, { limit: 1 });
  }, 1000000);
  test("calculateAznArbitrage", () => {
    const { e_prc, prc, qty, e_qty, nm, e_nm } = product;
    const expected = {
      e_tax: 7.98,
      e_costs: 6,
      e_mrgn: -7.35,
      e_mrgn_pct: -14.7,
      e_ns_costs: 6,
      e_ns_mrgn: -7.35,
      e_ns_mrgn_pct: -14.7
    }
    const mappedCategory = findMappedCategory([product.ebyCategories[0].id]);
    const result = calculateEbyArbitrage(
      mappedCategory!,
      e_prc, //VK
      prc * (e_qty / qty) //EK  //QTY Zielshop/QTY Herkunftsshop
    ) as any;

    if (result) {
      console.log("result:", result);
      console.log(
        JSON.stringify(
          {
            e_prc,
            prc,
            qty,
            e_qty,
            nm,
            e_nm,
          },
          null,
          2
        )
      );
      Object.keys(result).forEach((key) => {
        expect(result[key]).toEqual(expected[key as keyof typeof expected]);
      });
    }
  });
});
