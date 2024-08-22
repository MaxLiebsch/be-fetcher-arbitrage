import { describe, expect, test, beforeAll } from "@jest/globals";
import { path, read } from "fs-jetpack";
import {
  deleteAllArbispotterProducts,
  insertArbispotterProducts,
  //@ts-ignore
} from "../../src/services/db/util/crudArbispotterProduct.js";
//@ts-ignore
import dealOnAzn from "../../src/services/deals/daily/dealsOnAzn.js";
import { ObjectId } from "mongodb";

const shopDomain = ["cyberport.de"];

describe("pos azn listign", () => {
  let productLimit = 10;
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
  }, 100000);

  test("pos azn listign", async () => {
    console.log('test')
    const infos = await dealOnAzn({
      shopDomain,
      productLimit,
      _id: new ObjectId("60f3b3b3b3b3b3b3b3b3b3b3"),
      action: "",
      proxyType: "mix",
      concurrency: 4,
    });
    console.log("infos:", infos);
  }, 1000000);
});
