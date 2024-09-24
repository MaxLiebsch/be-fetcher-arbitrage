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
    await myBeforeAll(shopDomain, false, "126.0.6478.182");
  }, 1000000);

  test("Mimic for block detection is working", async () => {
    await mimicTest();
  }, 1000000);

  test("Extract product Infos", async () => {
    const products: any[] = [];
    const addProduct = async (product: ProductRecord) => {
      products.push(<any>product);
    };
    const handleNotFound = async (cause: string) => {
      console.log("Not found!");
    };
    const isFinished = async () => {
      console.log("Is done!");
      console.log(products.length);
      const priceRange = calculateMinMaxMedian(products as any);
      console.log("priceRange:", priceRange);
      const foundProduct = products.reduce(
        (cheapest, current) => {
          if (
            (!cheapest || (current.price && current.price <= cheapest.price)) &&
            (!priceRange.median ||
              (current.price && current.price <= priceRange.median)) &&
            current.link &&
            current.name
          ) {
            return current;
          }
          return cheapest;
        },

        null as Product | null
      );
      console.log("result:", priceRange, foundProduct.price, foundProduct.link);
    };
    await queryEansOnEby(
      addProduct,
      handleNotFound,
      isFinished,
      "5032410212945"
    );
  }, 200000);

  afterAll(async () => {
    await myAfterAll();
  });
});
