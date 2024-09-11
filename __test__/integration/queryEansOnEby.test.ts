import { describe, expect, test, beforeAll } from "@jest/globals";
import { path, read } from "fs-jetpack";
import {
  deleteAllArbispotterProducts,
  insertArbispotterProducts,
  //@ts-ignore
} from "../../src/db/util/crudArbispotterProduct.js";
//@ts-ignore
import queryEansOnEby from "../../src/services/queryEansOnEby.js";
import { ObjectId } from "mongodb";

const shopDomain = "gamestop.de";

describe("query eans on eby", () => {
  let productLimit = 10;
  beforeAll(async () => {
    const products = read(
      path("__test__/static/collections/arbispotter.gamestop.de-with-ean.json"),
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

  test("query eans on eby", async () => {
    const infos = await queryEansOnEby({
      concurrency: 4,
      type: "QUERY_EANS_ON_EBY",
      shopDomain,
      id: "queryEansOnEby",
      proxyType: 'mix',
      productLimit,
      _id: new ObjectId("60f3b3b3b3b3b3b3b3b3b3b3"),
      action: "",
    });
    console.log("infos:", infos);
  }, 1000000);
});
