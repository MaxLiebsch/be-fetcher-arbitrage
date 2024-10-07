import { safeParsePrice, detectCurrency } from "@dipmaxtech/clr-pkg";
import { describe, expect, test, beforeAll } from "@jest/globals";
describe("Price Picker", () => {
  const examples = [
    { str: "nur€79,-*", expect: 79.0, currency: "EUR" },
    { str: 1.019, expect: 1019, currency: null },
    { str: "1.499", expect: 1499, currency: null },
    { str: 10.027, expect: 10027, currency: null },
    { str: "10.027", expect: 10027, currency: null },
    { str: "1.027.65", expect: 1027.65, currency: null },
    { str: "10.027.65", expect: 10027.65, currency: null },
    { str: "zł12.99", expect: 12.99, currency: "PLN" },
    { str: "12,99zł", expect: 12.99, currency: "PLN" },
    { str: "12,99 zł", expect: 12.99, currency: "PLN" },
    { str: "PLN12,99", expect: 12.99, currency: "PLN" },
    { str: "£12,99", expect: 12.99, currency: "GBP" },
    { str: "GBP12,99", expect: 12.99, currency: "GBP" },
    { str: "GBP 12,99", expect: 12.99, currency: "GBP" },
    { str: "GBP12.99", expect: 12.99, currency: "GBP" },
    { str: "GBP 12.99", expect: 12.99, currency: "GBP" },
    { str: "GBP12", expect: 12.0, currency: "GBP" },
    { str: "GBP 12", expect: 12.0, currency: "GBP" },
    { str: "CHF 12.99", expect: 12.99, currency: "CHF" },
    { str: "Fr 12.99", expect: 12.99, currency: "CHF" },
    { str: "EUR 12,99/Stk.", expect: 12.99, currency: "EUR" },
    { str: "ab227,99€", expect: 227.99, currency: "EUR" },
    { str: "€55,58 + 0", expect: 55.58, currency: "EUR" },
    { str: "1.933 €", expect: 1933.0, currency: "EUR" },
    { str: "248\n,\n00€", expect: 248.0, currency: "EUR" },
    { str: "1.933€", expect: 1933.0, currency: "EUR" },
    { str: "Neu - 129,99 €", expect: 129.99, currency: "EUR" },
    { str: "EUR124,99bisEUR139,00", expect: 124.99, currency: "EUR" },
    { str: "EUR40,90bisEUR119,90", expect: 40.9, currency: "EUR" },
    { str: "371,97€inkl.MwSt.", expect: 371.97, currency: "EUR" },
    { str: "380,84€inkl.MwSt.", expect: 380.84, currency: "EUR" },
    { str: "3,99€inkl.MwSt.", expect: 3.99, currency: "EUR" },
    { str: "EUR27,99", expect: 27.99, currency: "EUR" },
    { str: "EUR1.136,2", expect: 1136.2, currency: "EUR" },
    { str: "EUR1.136,22", expect: 1136.22, currency: "EUR" },
    { str: "3,99..", expect: 3.99, currency: null },
    { str: "€1.019", expect: 1019.0, currency: "EUR" },
    { str: "€1.029,00", expect: 1029.0, currency: "EUR" },
    { str: "€ 1.029,00", expect: 1029.0, currency: "EUR" },
    { str: "389,99€", expect: 389.99, currency: "EUR" },
    { str: "389,99 €", expect: 389.99, currency: "EUR" },
    { str: "2399,–€", expect: 2399, currency: "EUR" },
    { str: "2399 ,–€", expect: 2399, currency: "EUR" },
    { str: "56,12€", expect: 56.12, currency: "EUR" },
    { str: "15,95", expect: 15.95, currency: null },
    { str: "€59,95", expect: 59.95, currency: "EUR" },
    { str: "€599,00", expect: 599.0, currency: "EUR" },
    { str: 669.99, expect: 669.99, currency: null },
    { str: 24.38, expect: 24.38, currency: null },
    { str: "0,00€", expect: 0.0, currency: "EUR" },
    { str: "279,00 €", expect: 279.0, currency: "EUR" },
    { str: 279, expect: 279.0, currency: null },
    { str: "563.89 €", expect: 563.89, currency: "EUR" },
    { str: "1.399,99 €", expect: 1399.99, currency: "EUR" },
    { str: 604.0032233, expect: 604.0, currency: null },
    { str: "604.61795", expect: 604.62, currency: null },
    { str: "568.71758", expect: 568.72, currency: null },
    { str: "ab609,00€", expect: 609.0, currency: "EUR" },
    { str: "3,99€..", expect: 3.99, currency: "EUR" },
  ];

  examples.forEach((example) => {
    test(`${example.str} becomes ${example.expect}`, () => {
      const parsedPrice = safeParsePrice(example.str);
      const currency = detectCurrency(example.str.toString());
      expect(currency).toBe(example.currency);
      expect(parsedPrice).toBe(example.expect);
    });
  });
});
