import { safeParsePrice } from "@dipmaxtech/clr-pkg";
import { describe, expect, test, beforeAll } from "@jest/globals";

describe("Price Picker", () => {
  const examples = [
    { str: "EUR 12,99/Stk.", expect: 12.99 },
    { str: "ab227,99€", expect: 227.99 },
    { str: "€55,58 + 0", expect: 55.58 },
    { str: "1.933 €", expect: 1933.0 },
    { str: "248\n,\n00€", expect: 248.0 },
    { str: "1.933€", expect: 1933.0 },
    { str: "Neu - 129,99 €", expect: 129.99 },
    { str: "EUR124,99bisEUR139,00", expect: 124.99 },
    { str: "EUR40,90bisEUR119,90", expect: 40.9 },
    { str: "371,97€inkl.MwSt.", expect: 371.97 },
    { str: "380,84€inkl.MwSt.", expect: 380.84 },
    { str: "3,99€inkl.MwSt.", expect: 3.99 },
    { str: "EUR27,99", expect: 27.99 },
    { str: "EUR1.136,2", expect: 1136.2 },
    { str: "EUR1.136,22", expect: 1136.22 },
    { str: "3,99..", expect: 3.99 },
    { str: "€1.019", expect: 1019.0 },
    { str: "€1.029,00", expect: 1029.0 },
    { str: "€ 1.029,00", expect: 1029.0 },
    { str: "389,99€", expect: 389.99 },
    { str: "389,99 €", expect: 389.99 },
    { str: "2399,–€", expect: 2399 },
    { str: "2399 ,–€", expect: 2399 },
    { str: "56,12€", expect: 56.12 },
    { str: "15,95", expect: 15.95 },
    { str: "€59,95", expect: 59.95 },
    { str: "€599,00", expect: 599.0 },
    { str: 669.99, expect: 669.99 },
    { str: 24.38, expect: 24.38 },
    { str: "0,00€", expect: 0.0 },
    { str: "279,00 €", expect: 279.0 },
    { str: 279, expect: 279.0 },
    { str: "563.89 €", expect: 563.89 },
    { str: "1.399,99 €", expect: 1399.99 },
    { str: 604.0032233, expect: 604.0 },
    { str: "604.61795", expect: 604.62 },
    { str: "568.71758", expect: 568.72 },
    { str: "ab609,00€", expect: 609.0 },
    { str: "3,99€..", expect: 3.99 },
  ];

  examples.forEach((example) => {
    test(`${example.str} becomes ${example.expect}`, () => {
      const parsedPrice = safeParsePrice(example.str);
      expect(parsedPrice).toBe(example.expect);
    });
  });
});
