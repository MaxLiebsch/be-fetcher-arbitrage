import { describe, expect, test, beforeAll } from "@jest/globals";
import { path, read } from "fs-jetpack";
import lookupCategory from "../../src/services/lookupCategory";
import { LocalLogger, ObjectId } from "@dipmaxtech/clr-pkg";
import { setTaskLogger } from "../../src/util/logger";
import { resetProperty } from "../../src/maintenance/resetProperty";
import {
  deleteAllProducts,
  insertProducts,
} from "../../src/db/util/crudProducts";

const shopDomain = "gamestop.de";

describe("lookup category", () => {
  let productLimit = 10;
  beforeAll(async () => {
    const products = read(
      path(
        "__test__/static/collections/arbispotter.gamestop.de-with-ean-with-esin.json"
      ),
      "json"
    );

    if (!products) {
      throw new Error("No azn listings found for " + shopDomain);
    }
    productLimit = products.length;
    console.log("products", products.length);
    await deleteAllProducts(shopDomain);
    await insertProducts(
      products.map((l) => {
        const id = l._id.$oid;
        delete l._id;
        return { ...l, _id: new ObjectId(id), sdmn: shopDomain };
      })
    );
    await resetProperty({
      $unset: {
        cat_prop: "",
        cat_taskId: "",
      },
    });
  }, 100000);

  test("lookup category", async () => {
    const logger = new LocalLogger().createLogger("LOOKUP_CATEGORY");
    setTaskLogger(logger, "TASK_LOGGER");
    //@ts-ignore
    const infos = await lookupCategory({
      concurrency: 4,
      type: "LOOKUP_CATEGORY",
      productLimit,
      _id: new ObjectId("60f3b3b3b3b3b3b3b3b3b3b3"),
      action: "none",
    });
    console.log("infos:", infos);
  }, 1000000);
});
