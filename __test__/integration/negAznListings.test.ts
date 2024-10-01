import { describe, test, beforeAll } from "@jest/globals";
import { path, read } from "fs-jetpack";
import negAznDeals from "../../src/services/deals/weekly/negAznDeals";
import { getActiveShops, getAllShopsAsArray } from "../../src/db/util/shops";
import { getArbispotterDb, getProductsCol } from "../../src/db/mongo";
import { sub } from "date-fns";
import { LocalLogger, ObjectId } from "@dipmaxtech/clr-pkg";
import { setTaskLogger } from "../../src/util/logger";
import { updateProgressNegDealAznTasks } from "../../src/util/updateProgressInTasks";
import {
  deleteAllProducts,
  insertProducts,
} from "../../src/db/util/crudProducts";
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
    await deleteAllProducts(shopDomain);
    const shops = await getActiveShops();
    const productCol = await getProductsCol();

    await Promise.all(
      shops!.map(async (shop) => {
        return productCol.updateMany(
          { sdmn: shop.d },
          {
            $set: {
              availUpdatedAt: sub(new Date(), { days: 2 }).toISOString(),
            },
            $unset: { azn_taskId: "", aznUpdatedAt: "" },
          }
        );
      })
    );
    await updateProgressNegDealAznTasks("mix");
    await insertProducts(
      aznListings.map((l) => {
        const id = l._id.$oid;
        delete l._id;
        return { ...l, _id: new ObjectId(id), sdmn: shopDomain };
      })
    );
  }, 100000);

  test("crawl azn listings", async () => {
    const logger = new LocalLogger().createLogger("CRAWL_AZN_LISTINGS");
    setTaskLogger(logger, "TASK_LOGGER");
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
