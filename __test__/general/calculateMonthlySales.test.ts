import { describe, expect, test, beforeAll } from "@jest/globals";
import {
  findArbispotterProduct,
  //@ts-ignore
} from "../../src/services/db/util/crudArbispotterProduct.js";
import {
  calculateMonthlySales,
} from "@dipmaxtech/clr-pkg";

describe("Calculate Monthly sales", () => {
  test("Calculate Monthly sales", async () => {
    const product = await findArbispotterProduct("idealo.de", {
      eanList: "0027075155725",
    });
    if (product) {
      const monthlySales = calculateMonthlySales(product.categories, product.salesRanks);
      console.log('monthlySales:', monthlySales)
    }
  });
});
