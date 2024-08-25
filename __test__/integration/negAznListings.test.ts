import { describe, test, beforeAll } from "@jest/globals";
import { path, read } from "fs-jetpack";
import {
  deleteAllArbispotterProducts,
  insertArbispotterProducts,
  //@ts-ignore
} from "../../src/services/db/util/crudArbispotterProduct.js";
//@ts-ignore
import negAznDeals from "../../src/services/deals/weekly/negAznDeals.js";
import { ObjectId } from "mongodb";
//@ts-ignore
import { getAllShopsAsArray } from "../../src/services/db/util/shops.js";
//@ts-ignore
import { getArbispotterDb } from "../../src/services/db/mongo.js";
//@ts-ignore
import { shopProxyTypeFilter } from "../../src/services/db/util/filter.js";
import { sub } from "date-fns";
const proxyType = "mix";

const shopDomain = "gamestop.de";

describe("crawl azn listings", () => {
  let productLimit = 15;
  beforeAll(async () => {
    const aznListings = read(
      path("__test__/static/collections/arbispotter.gamestop.de-azn-listings.json"),
      "json"
    );

    if (!aznListings) {
      throw new Error("No azn listings found for " + shopDomain);
    }
    console.log("aznListings", aznListings.length);
    await deleteAllArbispotterProducts(shopDomain);
    const shops = await getAllShopsAsArray();
    const filteredShops = shops.filter((shop) =>
      shopProxyTypeFilter(shop, proxyType)
    );
    const spotter = await getArbispotterDb();
    await Promise.all(
      filteredShops.map(async (shop) => {
        return spotter.collection(shop.d).updateMany(
          {},
          {
            $set: { availUpdatedAt: sub(new Date(), { days: 2 }) },
            $unset: { eby_taskId: "", ebyUpdatedAt: "" },
          }
        );
      })
    );
    
    await insertArbispotterProducts(
      shopDomain,
      aznListings.map((l) => {
        return { ...l, _id: new ObjectId(l._id.$oid) };
      })
    );
  }, 100000);
  
  test("crawl azn listings", async () => {
    const infos = await negAznDeals({
      proxyType: "mix", 
      productLimit,
      _id: new ObjectId("60f3b3b3b3b3b3b3b3b3b3b3"),
      action: "",
      concurrency: 4,
    });
    console.log("infos:", infos);
  }, 1000000);
});
