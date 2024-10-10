import { describe, expect, test, beforeAll } from "@jest/globals";
import { path, read } from "fs-jetpack";

import negEbyDeals from "../../src/services/deals/weekly/negEbyDeals";
import { getActiveShops} from "../../src/db/util/shops";
import {  getProductsCol } from "../../src/db/mongo";
import { sub } from "date-fns";
import { LocalLogger, ObjectId } from "@dipmaxtech/clr-pkg";
import { setTaskLogger } from "../../src/util/logger";
import {
  deleteAllProducts,
  insertProducts,
} from "../../src/db/util/crudProducts";
import { shopFilter } from "../../src/db/util/filter";

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
    await deleteAllProducts(shopDomain);
    await insertProducts(
      aznListings.map((l) => {
        const id = l._id.$oid;
        delete l._id;
        return { ...l, _id: new ObjectId(id), sdmn: shopDomain };
      })
    );

    const shops = await getActiveShops();
    const productCol = await getProductsCol();
    const filteredShops = shops!.filter((shop) =>
      shopFilter(shop)
    );
    await Promise.all(
      filteredShops.map(async (shop) => {
        return productCol.updateMany(
          {
            sdmn: shop.d,
          },
          {
            $set: {
              availUpdatedAt: sub(new Date(), { days: 2 }).toISOString(),
            },
            $unset: { eby_taskId: "", ebyUpdatedAt: "" },
          }
        );
      })
    );
  }, 100000);

  test("crawl eby listings", async () => {
    const logger = new LocalLogger().createLogger("CRAWL_EBY_LISTINGS");
    setTaskLogger(logger, "TASK_LOGGER");
    //@ts-ignore
    const infos = await negEbyDeals({
      productLimit,
      type: "CRAWL_EBY_LISTINGS",
      _id: new ObjectId("60f3b3b3b3b3b3b3b3b3b3b3"),
      action: "none",
      concurrency: 4,
    });
    console.log("infos:", infos);
  }, 1000000);
});
