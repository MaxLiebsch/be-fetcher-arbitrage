import { describe, test, beforeAll } from "@jest/globals";
import { path, read } from "fs-jetpack";
import {
  deleteAllArbispotterProducts,
  insertArbispotterProducts,
} from "../../src/db/util/crudArbispotterProduct";
import queryEansOnEby from "../../src/services/queryEansOnEby";
import { LocalLogger, ObjectId } from "@dipmaxtech/clr-pkg";
import { setTaskLogger } from "../../src/util/logger";
import { TASK_TYPES } from "../../src/util/taskTypes";
import { resetProperty } from "../../src/maintenance/resetProperty";

const shopDomain = "gamestop.de";

describe("query eans on eby", () => {
  let productLimit = 10;
  beforeAll(async () => {
    const products = read(
      path("__test__/static/collections/arbispotter.gamestop.de-with-ean.json"),
      "json"
    );

    if (!products) {
      throw new Error("No azn listings found for " + shopDomain);
    }
    productLimit = products.length;
    console.log("products", products.length);
    await deleteAllArbispotterProducts(shopDomain);
    await insertArbispotterProducts(
      shopDomain,
      products.map((l) => {
        return { ...l, _id: new ObjectId(l._id.$oid) };
      })
    );
    await resetProperty({ $unset: { eby_prop: "", eby_taskId: "" } });
  }, 100000);

  test("query eans on eby", async () => {
    const logger = new LocalLogger().createLogger("QUERY_EANS_EBY");
    setTaskLogger(logger, 'TASK_LOGGER');
    //@ts-ignore
    const infos = await queryEansOnEby({
      concurrency: 4,
      type: TASK_TYPES.QUERY_EANS_EBY,
      id: "queryEansOnEby",
      productLimit,
      _id: new ObjectId("60f3b3b3b3b3b3b3b3b3b3b3"),
      action: "none",
    });
    console.log("infos:", infos);
  }, 1000000);
});
