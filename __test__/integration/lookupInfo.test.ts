import { describe, expect, test, beforeAll } from "@jest/globals";
import { path, read } from "fs-jetpack";
import lookupInfo from "../../src/services/lookupInfo";
import { setTaskLogger } from "../../src/util/logger";
import { resetProperty } from "../../src/maintenance/resetProperty";
import { LocalLogger, ObjectId } from "@dipmaxtech/clr-pkg";
import {
  deleteAllProducts,
  insertProducts,
} from "../../src/db/util/crudProducts";

const shopDomain = "gamestop.de";

describe("lookup info", () => {
  let productLimit = 45;
  beforeAll(async () => {
    // const aznListings = read(
    //   path("__test__/static/collections/arbispotter.gamestop.de-with-ean.json"),
    //   "json"
    // );

    // if (!aznListings) {
    //   throw new Error("No lookup info listings found for " + shopDomain);
    // }
    // console.log("lookup info listings", aznListings.length);
    // await deleteAllProducts(shopDomain);
    // await insertProducts(
    //   aznListings.map((l) => {
    //     const id = l._id.$oid;
    //     delete l._id;
    //     return { ...l, _id: new ObjectId(id), sdmn: shopDomain };
    //   })
    // );
    await resetProperty({
      $unset: {
        info_prop: "",
        info_taskId: "",
      },
    });
  }, 100000);

  test("lookup info listings", async () => {
    const logger = new LocalLogger().createLogger("LOOKUP_INFO");
    setTaskLogger(logger, "TASK_LOGGER");

    //@ts-ignore
    const infos = await lookupInfo({
      productLimit,
      type: "LOOKUP_INFO",
      browserConcurrency: 3,
      concurrency: 1,
      _id: new ObjectId("60f3b3b3b3b3b3b3b3b3b3b3"),
      action: "none",
    });
    console.log("infos:", JSON.stringify(infos,null,2));
  }, 1000000);
});
