import { describe, expect, test, beforeAll } from "@jest/globals";
import {
  mimicTest,
  myBeforeAll,
  querySellerInfos,
} from "../utils/commonTests.js";
import {
  DbProductRecord,
  generateUpdate,
} from "@dipmaxtech/clr-pkg";
import { findProduct } from "../../../src/db/util/crudProducts.js";

const shopDomain = "sellercentral.amazon.de";



describe(shopDomain.charAt(0).toUpperCase() + shopDomain.slice(1), () => {
  beforeAll(async () => {
    await myBeforeAll(shopDomain);
  }, 1000000);

  test("Mimic for block detection is working", async () => {
    await mimicTest();
  }, 1000000);

  test("Extract product Infos", async () => {
    const product = await findProduct({ eanList: '0195208220944'})
    if(!product){
      throw new Error('Product not found')
    }
    const addProductInfo = async ({
      productInfo,
      url,
    }: {
      productInfo: any[] | null;
      url: string;
    }) => {
      console.log("productInfo:", productInfo);
      if (productInfo) {
        try {
          const update = generateUpdate(
            productInfo,
            product as unknown as DbProductRecord
          );
          console.log(update);
        } catch (error) {
          console.log("error:", error);
          console.log("error in generateUpdate");
        }
      }else{
        throw new Error('No product info found')
      }
    };

    await querySellerInfos(
      addProductInfo,
      product as unknown as DbProductRecord
    );
  }, 200000);

  // afterAll(async () => {
  //   await myAfterAll();
  // });
});
