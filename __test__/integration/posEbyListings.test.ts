import { describe, expect, test, beforeAll } from "@jest/globals";
import { path, read } from "fs-jetpack";
import {
  deleteAllArbispotterProducts,
  insertArbispotterProducts,
} from "../../src/db/util/crudArbispotterProduct";
import dealsOnEby from "../../src/services/deals/daily/dealsOnEby";
import { LocalLogger, ObjectId } from "@dipmaxtech/clr-pkg";
import { setTaskLogger } from "../../src/util/logger";
import { getAllShopsAsArray } from "../../src/db/util/shops";
import { getArbispotterDb } from "../../src/db/mongo";
import { sub } from "date-fns";

const shopDomain = ["alternate.de", "idealo.de", "alza.de"];

describe("pos eby listings", () => {
  let productLimit = 30;
  beforeAll(async () => {
    const listings = shopDomain.map((shopDomain) => {
      return read(
        path(
          `__test__/static/collections/arbispotter.${shopDomain}-pos-eby-listing.json`
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
    const spotter = await getArbispotterDb();
    await Promise.all(
      shops!.map(async (shop) => {
        return spotter.collection(shop.d).updateMany(
          {},
          {
            $set: {
              availUpdatedAt: sub(new Date(), { days: 2 }).toISOString(),
            },
            $unset: { dealEbyTaskId: "", dealEbyUpdatedAt: "" },
          }
        );
      })
    );
  }, 100000);

  test("pos eby listings", async () => {
    const logger = new LocalLogger().createLogger("DEALS_ON_EBY");
    setTaskLogger(logger);
    //@ts-ignore
    const infos = await dealsOnEby({
      productLimit,
      type: "DEALS_ON_EBY",
      _id: new ObjectId("60f3b3b3b3b3b3b3b3b3b3b3"),
      action: "none",
      proxyType: "mix",
      concurrency: 4,
    });
    console.log("infos:", infos);
  }, 1000000);
});
