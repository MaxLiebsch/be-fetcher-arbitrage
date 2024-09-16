import { describe, expect, test, beforeAll } from "@jest/globals";
import { path, read } from "fs-jetpack";
import {
  deleteAllArbispotterProducts,
  insertArbispotterProducts,
} from "../../src/db/util/crudArbispotterProduct";
import negEbyDeals from "../../src/services/deals/weekly/negEbyDeals";
import { getAllShopsAsArray } from "../../src/db/util/shops";
import { getArbispotterDb } from "../../src/db/mongo";
import { shopProxyTypeFilter } from "../../src/db/util/filter";
import { sub } from "date-fns";
import { LocalLogger, ObjectId } from "@dipmaxtech/clr-pkg";
import { setTaskLogger } from "../../src/util/logger";

const shopDomain = "alternate.de";
const proxyType = "mix";

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

    const shops = await getAllShopsAsArray();
    const filteredShops = shops!.filter((shop) =>
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
  }, 100000);

  test("crawl eby listings", async () => {
    const logger = new LocalLogger().createLogger("CRAWL_EBY_LISTINGS");
    setTaskLogger(logger);
    //@ts-ignore
    const infos = await negEbyDeals({
      proxyType,
      productLimit,
      type: "CRAWL_EBY_LISTINGS",
      _id: new ObjectId("60f3b3b3b3b3b3b3b3b3b3b3"),
      action: "none",
      concurrency: 4,
    });
    console.log("infos:", infos);
  }, 1000000);
});
