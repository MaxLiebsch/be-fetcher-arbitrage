import { describe, expect, test, beforeAll } from "@jest/globals";
import { path, read } from "fs-jetpack";
import {
  deleteAllArbispotterProducts,
  insertArbispotterProducts,
  //@ts-ignore
} from "../../src/db/util/crudArbispotterProduct.js";
//@ts-ignore
import lookupCategory from "../../src/services/lookupCategory.js";
import { ObjectId } from "mongodb";

const shopDomain = "gamestop.de";

describe("lookup category", () => {
  let productLimit = 10;
  beforeAll(async () => {
    const products = read(
      path(
        "__test__/static/collections/arbispotter.gamestop.de-with-ean-with-esin.json"
      ),
      "json"
    );

    if (!products) {
      throw new Error("No azn listings found for " + shopDomain);
    }
    productLimit = products.length;
    console.log("products", products.length);
    await deleteAllArbispotterProducts(shopDomain);
    await insertArbispotterProducts(
      shopDomain,
      products.map((l) => {
        return { ...l, _id: new ObjectId(l._id.$oid) };
      })
    );
  }, 100000);

  test("lookup category", async () => {
    const infos = await lookupCategory({
      concurrency: 4,
      type: "LOOKUP_CATEGORY",
      shopDomain,
      productLimit,
      _id: new ObjectId("60f3b3b3b3b3b3b3b3b3b3b3"),
      action: "",
    });
    console.log("infos:", infos);
  }, 1000000);
});
