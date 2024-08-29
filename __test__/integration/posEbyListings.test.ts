import { describe, expect, test, beforeAll } from "@jest/globals";
import { path, read } from "fs-jetpack";
import {
  deleteAllArbispotterProducts,
  insertArbispotterProducts,
  //@ts-ignore
} from "../../src/services/db/util/crudArbispotterProduct.js";
//@ts-ignore
import dealsOnEby from "../../src/services/deals/daily/dealsOnEby.js";
import { ObjectId } from "mongodb";

const shopDomain = ["alternate.de", "idealo.de", 'alza.de'];

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
  }, 100000);

  test("pos eby listings", async () => {
    console.log('test')
    const infos = await dealsOnEby({
      shopDomain,
      productLimit,
      type: "DEALS_ON_EBY",
      _id: new ObjectId("60f3b3b3b3b3b3b3b3b3b3b3"),
      action: "",
      proxyType: "mix",
      concurrency: 4,
    });
    console.log("infos:", infos);
  }, 1000000);
});
