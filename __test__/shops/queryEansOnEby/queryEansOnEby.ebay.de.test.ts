import { describe, expect, test, beforeAll } from "@jest/globals";
import {
  mimicTest,
  myAfterAll,
  myBeforeAll,
  queryEansOnEby,
} from "../utils/commonTests.js";

import { ProductRecord } from "@dipmaxtech/clr-pkg/lib/types/product.js";
import { Product } from "@dipmaxtech/clr-pkg/lib/types/query.js";
//@ts-ignore
import { calculateMinMaxMedian } from "../../../src/util/calculateMinMaxMedian.js";

const shopDomain = "ebay.de";
//TODO: test notfound, multiple asins
//TODO : make sure mimic does not create fake block
describe(shopDomain.charAt(0).toUpperCase() + shopDomain.slice(1), () => {
  beforeAll(async () => {
    await myBeforeAll(shopDomain, false, "126.0.6478.126");
  }, 1000000);

  test("Mimic for block detection is working", async () => {
    await mimicTest();
  }, 1000000);

  test("Extract product Infos", async () => {
    const products: Product[] = [];
    const addProduct = async (product: ProductRecord) => {
      products.push(<Product>product);
    };
    const handleNotFound = async (cause: string) => {
      console.log("Not found!");
    };
    const isFinished = async () => {
      console.log("Is done!");
      console.log(products.length);
      console.log(
        products.reduce((acc, product) => {
          if (product.price && product.link) {
            acc.push({ price: product.price, link: product.link });
          }
          return acc;
        }, [])
      );
      const result = calculateMinMaxMedian(products);
      console.log("result:", result);
    };
    await queryEansOnEby(
      addProduct,
      handleNotFound,
      isFinished,
      "4011689688157"
    );
  }, 200000);

  afterAll(async () => {
    await myAfterAll();
  });
});
