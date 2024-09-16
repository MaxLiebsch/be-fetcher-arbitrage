import { describe, expect, test, beforeAll } from "@jest/globals";
import { path, read } from "fs-jetpack";
import {
  deleteAllArbispotterProducts,
  insertArbispotterProducts,
} from "../../src/db/util/crudArbispotterProduct";
import crawlEan from "../../src/services/crawlEan";
import { LocalLogger, ObjectId } from "@dipmaxtech/clr-pkg";
import { setTaskLogger } from "../../src/util/logger";
import { resetProperty } from "../../src/maintenance/resetProperty";

const shopDomain = "gamestop.de";

describe("crawl eans", () => {
  let productLimit = 25;
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
    await resetProperty({
      $set: {
        eanList: [],
      },
      $unset: {
        ean: "",
        ean_prop: "",
        ean_taskId: "",
      },
    });
  }, 100000);

  test("crawl eans", async () => {
    const logger = new LocalLogger().createLogger("CRAWL_EAN");
    setTaskLogger(logger);
    //@ts-ignore
    const infos = await crawlEan({
      concurrency: 4,
      type: "CRAWL_EAN",
      proxyType: "mix",
      productLimit,
      _id: new ObjectId("60f3b3b3b3b3b3b3b3b3b3b3"),
      action: "none",
    });
    console.log("infos:", infos);
  }, 1000000);
});
