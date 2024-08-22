import { describe, expect, test, beforeAll } from "@jest/globals";
import { path, read } from "fs-jetpack";
import {
  deleteAllArbispotterProducts,
  insertArbispotterProducts,
  //@ts-ignore
} from "../../src/services/db/util/crudArbispotterProduct.js";
//@ts-ignore
import crawlEan from "../../src/services/crawlEan.js";
import { ObjectId } from "mongodb";

const shopDomain = "gamestop.de";

describe("crawl eans", () => {
  let productLimit = 10;
  beforeAll(async () => {
    const products = read(
      path("__test__/static/collections/arbispotter.gamestop.de.json"),
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

  test("crawl eans", async () => {
    const infos = await crawlEan({
      concurrency: 4,
      type: "CRAWL_EANS",
      shopDomain,
      proxyType: 'mix',
      productLimit,
      _id: new ObjectId("60f3b3b3b3b3b3b3b3b3b3b3"),
      action: "",
    });
    console.log("infos:", infos);
  }, 1000000);
});
