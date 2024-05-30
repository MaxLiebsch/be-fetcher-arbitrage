import { getPrice } from "@dipmaxtech/clr-pkg";
import { describe, expect, test, beforeAll } from "@jest/globals";
import parsePrice from "parse-price";

describe("Price Picker", () => {
    const examples = [
      { str: "€1.029,00", expect: 1029.0 },
      { str: '€ 1.029,00', expect: 1029.0 },
      { str: "389,99€", expect: 389.99 },
      { str: '389,99 €', expect: 389.99 },
      { str: "2399,–€", expect: 2399 },
      { str: "2399 ,–€", expect: 2399 },
      { str: '56,12€', expect: 56.12 },
      { str: '15,95', expect: 15.95 },
      { str: 'ab227,99€', expect: 227.99 },
      { str: '€59,95', expect: 59.95 },
      { str: '€599,00', expect: 599.00 },
      {str: 669.99, expect: 669.99},
    ];
//   test("test", () => {
//     examples.forEach((example) => {
//       expect(parsePrice(getPrice(example.str))).toBe(example.expect);
//     });
//   });

  test("test with parsePrice only", () => {

    examples.forEach((example) => {
      expect(parsePrice(example.str)).toBe(example.expect);
    });
  });
});
