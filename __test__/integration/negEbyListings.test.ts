import { describe, expect, test, beforeAll } from "@jest/globals";
import { path, read } from "fs-jetpack";
import {
  deleteAllArbispotterProducts,
  insertArbispotterProducts,
  //@ts-ignore
} from "../../src/services/db/util/crudArbispotterProduct.js";
//@ts-ignore
import negEbyDeals from "../../src/services/deals/weekly/negEbyDeals.js";
import { ObjectId } from "mongodb";

const shopDomain = "alternate.de";

describe("crawl eby listings", () => {
  let productLimit = 10;
  beforeAll(async () => {
    const aznListings = read(
      path(
        "__test__/static/collections/arbispotter.alternate.de-neg-eby-weekly.json"
      ),
      "json"
    );

    if (!aznListings) {
      throw new Error("No azn listings found for " + shopDomain);
    }
    productLimit = aznListings.length;
    console.log("ebyListings", aznListings.length);
    await deleteAllArbispotterProducts(shopDomain);
    await insertArbispotterProducts(
      shopDomain,
      aznListings.map((l) => {
        return { ...l, _id: new ObjectId(l._id.$oid) };
      })
    );
  }, 100000);

  test("crawl eby listings", async () => {
    const infos = await negEbyDeals({
      shopDomain,
      productLimit,
      _id: new ObjectId("60f3b3b3b3b3b3b3b3b3b3b3"),
      action: "",
      concurrency: 4,
    });
    console.log("infos:", infos);
  }, 1000000);
});
