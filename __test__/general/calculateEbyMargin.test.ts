import {
  calculateAznArbitrage,
  calculateEbyArbitrage,
} from "@dipmaxtech/clr-pkg";
import { describe, expect, test, beforeAll } from "@jest/globals";

describe("calculate arbitrage", () => {
  const expected = {
    e_mrgn: 215.24,
    e_mrgn_pct: 25.5,
    e_ns_mrgn: 177.25,
    e_ns_mrgn_pct: 21,
  };
  const result = calculateEbyArbitrage(
    {
      category: "Computer, Tablets & Netzwerk",
      id: 58058,
      tier: {
        no_shop: [
          { up_to: 990, percentage: 0.065 },
          { above: 990, percentage: 0.02 },
        ],
        shop: [
          { above: 400, percentage: 0.02 },
          { up_to: 400, percentage: 0.065 },
        ],
      },
    },
    844.13,
    567.9
  ) as any;

  if (result)
    Object.keys(result).forEach((key) => {
      test(`${key}`, () => {
        expect(result[key]).toEqual(expected[key as keyof typeof expected]);
      });
    });
});
