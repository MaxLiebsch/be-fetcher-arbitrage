import { describe, expect, test, beforeAll } from "@jest/globals";
import { findArbispotterProductFilter } from "../../src/db/util/crudArbispotterProduct.js";
import { calculateMonthlySales } from "@dipmaxtech/clr-pkg";

describe("Calculate Monthly sales", () => {
  test("Calculate Monthly sales", async () => {
    const product = await findArbispotterProductFilter("cyberport.de", {
      // eanList: "3389119405058", //sales
      asin: 'B09H2N5QFH',
    });
    //0773602470358 hauptkategorie in categoryTree
    if (product) {
      const monthlySales = calculateMonthlySales(
        product.categories!,
        product.salesRanks!,
        product.categoryTree!
      );
      console.log("monthlySales:", monthlySales);
    }
  });
});
