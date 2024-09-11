import { describe, expect, test, beforeAll } from "@jest/globals";
import { path, read } from "fs-jetpack";
import {
  deleteAllArbispotterProducts,
  insertArbispotterProducts,
  //@ts-ignore
} from "../../src/db/util/crudArbispotterProduct.js";
//@ts-ignore
import match from "../../src/services/match.js";
import { ObjectId } from "mongodb";

const shopDomain = "cyberport.de";

describe("match", () => {
  let productLimit = 10;
  beforeAll(async () => {
    const products = read(
      path("__test__/static/collections/arbispotter.cyberport.de-match.json"),
      "json"
    );

    if (!products) {
      throw new Error("No azn listings found for " + shopDomain);
    }
    console.log("products", products.length);
    await deleteAllArbispotterProducts(shopDomain);
    await insertArbispotterProducts(
      shopDomain,
      products.map((l) => {
        return { ...l, _id: new ObjectId(l._id.$oid) };
      })
    );
  }, 100000);

  test("match", async () => {
    const infos = await match({
      concurrency: 4,
      type: "MATCH_PRODUCTS",
      shopDomain,
      productLimit,
      extendedLookUp: true,
      startShops: [
        {
          d: "idealo.de",
          prefix: "i_",
          name: "Idealo",
        },
      ],
      _id: new ObjectId("60f3b3b3b3b3b3b3b3b3b3b3"),
      action: "",
    });
    console.log("infos:", infos);
  }, 1000000);
});
