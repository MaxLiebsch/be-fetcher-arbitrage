import { describe, expect, test, beforeAll } from "@jest/globals";
//@ts-ignore
import testParameters from "../utils/testParamter.js";
import {
  extractProductInfos,
  mimicTest,
  myAfterAll,
  myBeforeAll,
  queryEansOnEby,
  querySellerInfos,
} from "../utils/commonTests.js";
import {
  safeParsePrice,
  calculateAznArbitrage,
  getNumber,
  generateUpdate,
} from "@dipmaxtech/clr-pkg";
import { ProductRecord } from "@dipmaxtech/clr-pkg/lib/types/product.js";
import { Product } from "@dipmaxtech/clr-pkg/lib/types/query.js";

const shopDomain = "ebay.de";
//TODO: test notfound, multiple asins
//TODO : make sure mimic does not create fake block
describe(shopDomain.charAt(0).toUpperCase() + shopDomain.slice(1), () => {
  beforeAll(async () => {
    await myBeforeAll(shopDomain, false, "124.0.6367.207");
  }, 1000000);

  test("Mimic for block detection is working", async () => {
    await mimicTest();
  }, 1000000);

  test("Extract product Infos", async () => {
    const products: Product[] = [];
    const addProduct = async (product: ProductRecord) => {
      products.push(<Product>product);
    };
    const handleNotFound = async () => {
      console.log("Not found!");
    };
    const isFinished = async () => {
      console.log("Is done!");
      console.log(products);
    };
    await queryEansOnEby(
      addProduct,
      handleNotFound,
      isFinished,
      "5025232921331"
    );
  }, 200000);

  // afterAll(async () => {
  //   await myAfterAll();
  // });
});
