import { describe, expect, test, beforeAll } from "@jest/globals";
import { path, read } from "fs-jetpack";
import {
  deleteAllArbispotterProducts,
  insertArbispotterProducts,
} from "../../src/db/util/crudArbispotterProduct";
import dealOnAzn from "../../src/services/deals/daily/dealsOnAzn";
import { LocalLogger, ObjectId } from "@dipmaxtech/clr-pkg";
import { setTaskLogger } from "../../src/util/logger";
import { getAllShopsAsArray } from "../../src/db/util/shops";
import { getArbispotterDb } from "../../src/db/mongo";
import { sub } from "date-fns";
import { updateProgressDealsOnAznTasks } from "../../src/util/updateProgressInTasks";

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
        await deleteAllArbispotterProducts(shopDomain);
        await insertArbispotterProducts(
          shopDomain,
          listings[i].map((l) => {
            return { ...l, _id: new ObjectId(l._id.$oid) };
          })
        );
      })
    );
    const shops = await getAllShopsAsArray();
    //@ts-ignore
    shops!.push({ d: "sales" });
    const spotter = await getArbispotterDb();
    await Promise.all(
      shops!.map(async (shop) => {
        return spotter.collection(shop.d).updateMany(
          {},
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
