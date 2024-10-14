import { describe, expect, test, beforeAll } from "@jest/globals";
import {
  mimicTest,
  myAfterAll,
  myBeforeAll,
  queryAznListing,
} from "../utils/commonTests.js";

const shopDomain = "amazon.de";
//TODO: test notfound, multiple asins
//TODO : make sure mimic does not create fake block
describe(shopDomain.charAt(0).toUpperCase() + shopDomain.slice(1), () => {
  const listings = [
    "https://www.amazon.de/dp/B07RNH35K4/?smid=AMKMU6R3UYA79&tag=idealode-mp-pk-21&linkCode=asn&creative=6742&camp=1638&creativeASIN=B07RNH35K4&ascsubtag=2024-06-20_f7661882e998e7beb1246d5728428873b784e672e0e3c994f20e44975a88b462&th=1&psc=1&language=de_DE",
    "https://www.amazon.de/dp/B07P4L991H/?smid=A2A9P9OETVPE4K&tag=idealode-mp-pk-21&linkCode=asn&creative=6742&camp=1638&creativeASIN=B07P4L991H&ascsubtag=2024-06-20_f7661882e998e7beb1246d5728428873b784e672e0e3c994f20e44975a88b462&th=1&psc=1&language=de_DE",
    "https://www.amazon.de/dp/B0BXF76L8F/?smid=A35PS5P69CW6E3&tag=idealode-mp-pk-21&linkCode=asn&creative=6742&camp=1638&creativeASIN=B0BXF76L8F&ascsubtag=2024-06-20_f7661882e998e7beb1246d5728428873b784e672e0e3c994f20e44975a88b462&th=1&psc=1&language=de_DE",
    "https://www.amazon.de/dp/B07R1D55ZN/?smid=A16QUKM5NDJ651&tag=idealode-mp-pk-21&linkCode=asn&creative=6742&camp=1638&creativeASIN=B07R1D55ZN&ascsubtag=2024-06-20_f7661882e998e7beb1246d5728428873b784e672e0e3c994f20e44975a88b462&th=1&psc=1&language=de_DE",
  ];
  beforeAll(async () => {
    await myBeforeAll(shopDomain);
  }, 1000000);

  test("Mimic for block detection is working", async () => {
    await mimicTest();
  }, 1000000);

  test("Extract product Infos", async () => {
    for (let index = 0; index < listings.length; index++) {
      const listing = listings[index];
      const addProductInfo = async ({
        productInfo,
        url,
      }: {
        productInfo: any[] | null;
        url: string;
      }) => {
        if (productInfo) {
          const infoMap = new Map();
          productInfo.forEach((info) => infoMap.set(info.key, info.value));
          expect(infoMap.get("a_prc")).toBeDefined();
        }
      };
      await queryAznListing(addProductInfo, listing);
    }
  }, 200000);

  //   afterAll(async () => {
  //     await myAfterAll();
  //   });
});
