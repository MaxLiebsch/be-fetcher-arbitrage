import { describe, expect, test, beforeAll } from "@jest/globals";
//@ts-ignore
import { getArbispotterDb } from "../../src/db/mongo.js";
import { reduceSalesRankArray } from "@dipmaxtech/clr-pkg";

describe("reduceArray", () => {
  test(`reduceArray`, async () => {
    const db = await getArbispotterDb();
    const shopDomain = "idealo.de";
    const col = db.collection(shopDomain);

    const products = await col
      .find({ eanList: "4057081041404" }, { limit: 1 })
      .toArray();
    const { salesRanks, ahstprcs, auhstprcs, anhstprcs } = products[0];
    const result: any = {};
    if (salesRanks) {
      const _salesRanks = salesRanks;
      Object.entries(salesRanks).forEach(([key, value]) => {
        if (value.length > 2) {
          _salesRanks[key] = reduceSalesRankArray(value);
        }
      });
      if (Object.keys(_salesRanks).length > 0) {
        result["salesRanks"] = _salesRanks;
      }
    }

    if (ahstprcs) {
      if (ahstprcs.length > 2) {
        result["ahstprcs"] = reduceSalesRankArray(ahstprcs);
      }
    }
    if (auhstprcs) {
      if (auhstprcs.length > 2) {
        result["auhstprcs"] = reduceSalesRankArray(auhstprcs);
      }
    }
    if (anhstprcs) {
      if (anhstprcs.length > 2) {
        result["anhstprcs"] = reduceSalesRankArray(anhstprcs);
      }
    }
    console.log(result.salesRanks['2707061031']);
  });
});
