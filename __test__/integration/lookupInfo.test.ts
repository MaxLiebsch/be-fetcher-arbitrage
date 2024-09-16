import { describe, expect, test, beforeAll } from "@jest/globals";
import { path, read } from "fs-jetpack";
import {
  deleteAllArbispotterProducts,
  insertArbispotterProducts,
} from "../../src/db/util/crudArbispotterProduct";
import lookupInfo from "../../src/services/lookupInfo";
import { setTaskLogger } from "../../src/util/logger";
import { resetProperty } from "../../src/maintenance/resetProperty";
import { LocalLogger, ObjectId } from "@dipmaxtech/clr-pkg";

const shopDomain = "gamestop.de";

describe("lookup info", () => {
  let productLimit = 10;
  beforeAll(async () => {
    const aznListings = read(
      path("__test__/static/collections/arbispotter.gamestop.de-with-ean.json"),
      "json"
    );

    if (!aznListings) {
      throw new Error("No lookup info listings found for " + shopDomain);
    }
    console.log("lookup info listings", aznListings.length);
    await deleteAllArbispotterProducts(shopDomain);
    await insertArbispotterProducts(
      shopDomain,
      aznListings.map((l) => {
        return { ...l, _id: new ObjectId(l._id.$oid) };
      })
    );
    await resetProperty({
      $unset: {
        info_prop: "",
        info_taskId: "",
      },
    });
  }, 100000);

  test("lookup info listings", async () => {
    const logger = new LocalLogger().createLogger("LOOKUP_INFO");
    setTaskLogger(logger);

    //@ts-ignore
    const infos = await lookupInfo({
      productLimit,
      type: "LOOKUP_INFO",
      browserConcurrency: 3,
      concurrency: 1,
      _id: new ObjectId("60f3b3b3b3b3b3b3b3b3b3b3"),
      action: "none",
    });
    console.log("infos:", infos);
  }, 1000000);
});
