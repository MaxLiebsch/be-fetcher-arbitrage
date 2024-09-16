import { describe, expect, test, beforeAll } from "@jest/globals";
import { path, read } from "fs-jetpack";
import {
  deleteAllArbispotterProducts,
  insertArbispotterProducts,
} from "../../src/db/util/crudArbispotterProduct";
import match from "../../src/services/match";
import { LocalLogger, ObjectId } from "@dipmaxtech/clr-pkg";
import { setTaskLogger } from "../../src/util/logger";

const shopDomain = "cyberport.de";

describe("match", () => {
  let productLimit = 10;
  beforeAll(async () => {
    const products = read(
      path("__test__/static/collections/arbispotter.cyberport.de-match.json"),
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
  }, 100000);

  test("match", async () => {
    const logger = new LocalLogger().createLogger("MATCH_PRODUCTS");
    setTaskLogger(logger);
    //@ts-ignore
    const infos = await match({
      concurrency: 4,
      type: "MATCH_PRODUCTS",
      shopDomain,
      productLimit,
      extendedLookUp: true,
      startShops: [
        {
          d: "idealo.de",
          prefix: "i_",
          name: "Idealo",
        },
      ],
      _id: new ObjectId("60f3b3b3b3b3b3b3b3b3b3b3"),
      action: "none",
    });
    console.log("infos:", infos);
  }, 1000000);
});
