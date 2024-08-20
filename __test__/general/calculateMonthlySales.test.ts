import { describe, expect, test, beforeAll } from "@jest/globals";
import {
  findArbispotterProduct,
  //@ts-ignore
} from "../../src/services/db/util/crudArbispotterProduct.js";
import { calculateMonthlySales } from "@dipmaxtech/clr-pkg";

describe("Calculate Monthly sales", () => {
  test("Calculate Monthly sales", async () => {
    const product = await findArbispotterProduct("idealo.de", {
      // eanList: "3389119405058", //sales
      eanList: "0773602470358"
    });
    //0773602470358 hauptkategorie in categoryTree
    if (product) {
      const monthlySales = calculateMonthlySales(
        product.categories,
        product.salesRanks,
        product.categoryTree
      );
      console.log("monthlySales:", monthlySales);
    }
  });
});
