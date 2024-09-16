import { describe, test, beforeAll } from "@jest/globals";
import { path, read } from "fs-jetpack";
import {
  deleteAllArbispotterProducts,
  insertArbispotterProducts,
} from "../../src/db/util/crudArbispotterProduct";
import negAznDeals from "../../src/services/deals/weekly/negAznDeals";
import { getAllShopsAsArray } from "../../src/db/util/shops";
import { getArbispotterDb } from "../../src/db/mongo";
import { sub } from "date-fns";
import { LocalLogger, ObjectId } from "@dipmaxtech/clr-pkg";
import { setTaskLogger } from "../../src/util/logger";
const proxyType = "mix";

const shopDomain = "gamestop.de";

describe("crawl azn listings", () => {
  let productLimit = 15;
  beforeAll(async () => {
    const aznListings = read(
      path(
        "__test__/static/collections/arbispotter.gamestop.de-azn-listings.json"
      ),
      "json"
    );

    if (!aznListings) {
      throw new Error("No azn listings found for " + shopDomain);
    }
    console.log("aznListings", aznListings.length);
    await deleteAllArbispotterProducts(shopDomain);
    const shops = await getAllShopsAsArray();
    const spotter = await getArbispotterDb();
    await Promise.all(
      shops!.map(async (shop) => {
        return spotter.collection(shop.d).updateMany(
          {},
          {
            $set: { availUpdatedAt: sub(new Date(), { days: 2 }).toISOString() },
            $unset: { azn_taskId: "", aznUpdatedAt: "" },
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
    const logger = new LocalLogger().createLogger("CRAWL_AZN_LISTINGS");
    setTaskLogger(logger);
    //@ts-ignore
    const infos = await negAznDeals({
      proxyType: "mix",
      productLimit,
      type: "CRAWL_AZN_LISTINGS",
      _id: new ObjectId("60f3b3b3b3b3b3b3b3b3b3b3"),
      action: "none",
      concurrency: 4,
    });
    console.log("infos:", infos);
  }, 1000000);
});
