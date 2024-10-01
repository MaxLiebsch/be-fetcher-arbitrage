import { describe, expect, test, beforeAll } from "@jest/globals";
import { path, read } from "fs-jetpack";
import dealOnAzn from "../../src/services/deals/daily/dealsOnAzn";
import { LocalLogger, ObjectId } from "@dipmaxtech/clr-pkg";
import { setTaskLogger } from "../../src/util/logger";
import { getActiveShops } from "../../src/db/util/shops";
import { getProductsCol } from "../../src/db/mongo";
import { sub } from "date-fns";
import { updateProgressDealsOnAznTasks } from "../../src/util/updateProgressInTasks";
import {
  deleteAllProducts,
  insertProducts,
} from "../../src/db/util/crudProducts";

const shopDomain = ["cyberport.de", "reichelt.de", "alza.de"];

describe("pos azn listign", () => {
  let productLimit = 30;
  beforeAll(async () => {
    const listings = shopDomain.map((shopDomain) => {
      return read(
        path(
          `__test__/static/collections/arbispotter.${shopDomain}-pos-azn-listing.json`
        ),
        "json"
      );
    });
    console.log(
      "listings:",
      listings.reduce((acc, l) => acc + l.length, 0)
    );
    await Promise.all(
      shopDomain.map(async (shopDomain, i) => {
        await deleteAllProducts(shopDomain);
        await insertProducts(
          listings[i].map((l) => {
            const id = l._id.$oid;
            delete l._id;
            return { ...l, _id: new ObjectId(id), sdmn: shopDomain };
          })
        );
      })
    );
    const shops = await getActiveShops();
    const productCol = await getProductsCol();
    await Promise.all(
      shops!.map(async (shop) => {
        return productCol.updateMany(
          {
            sdmn: shop.d,
          },
          {
            $set: {
              availUpdatedAt: sub(new Date(), { days: 2 }).toISOString(),
            },
            $unset: { dealAznTaskId: "", dealAznUpdatedAt: "" },
          }
        );
      })
    );
    await updateProgressDealsOnAznTasks("mix");
  }, 100000);

  test("pos azn listign", async () => {
    const logger = new LocalLogger().createLogger("DEALS_ON_AZN");
    setTaskLogger(logger, "TASK_LOGGER");
    //@ts-ignore
    const infos = await dealOnAzn({
      productLimit,
      type: "DEALS_ON_AZN",
      _id: new ObjectId("60f3b3b3b3b3b3b3b3b3b3b3"),
      action: "none",
      proxyType: "mix",
      concurrency: 4,
    });
    console.log("infos:", infos);
  }, 1000000);
});
