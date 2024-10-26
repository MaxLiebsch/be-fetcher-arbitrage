import { describe, expect, test, beforeAll } from "@jest/globals";
import { path, read } from "fs-jetpack";
import crawlEan from "../../src/services/crawlEan";
import { LocalLogger, ObjectId } from "@dipmaxtech/clr-pkg";
import { setTaskLogger } from "../../src/util/logger";
import { resetProperty } from "../../src/maintenance/resetProperty";
import {
  deleteAllProducts,
  insertProducts,
} from "../../src/db/util/crudProducts";

const shopDomain = "gamestop.de";

describe("crawl eans", () => {
  let productLimit = 25;
  beforeAll(async () => {
    const products = read(
      path("__test__/static/collections/arbispotter.gamestop.de.json"),
      "json"
    );

    if (!products) {
      console.log('not found') 
    }
    // console.log("products", products.length);
    // await deleteAllProducts(shopDomain);
    // await insertProducts(
    //   products.map((l) => {
    //     const id = l._id.$oid;
    //     delete l._id;
    //     return { ...l, _id: new ObjectId(id), sdmn: shopDomain };
    //   })
    // );
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
    setTaskLogger(logger, "TASK_LOGGER");
    //@ts-ignore
    const infos = await crawlEan({
      concurrency: 4,
      type: "CRAWL_EAN",
      productLimit,
      _id: new ObjectId("60f3b3b3b3b3b3b3b3b3b3b3"),
      action: "none",
    });
    console.log("infos:", infos);
  }, 1000000);
});
