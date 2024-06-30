import { calculateAznArbitrage } from "@dipmaxtech/clr-pkg";
import { describe, expect, test, beforeAll } from "@jest/globals";

describe("calculate arbitrage", () => {
  test("#1", () => {
    const result = calculateAznArbitrage(
      58.07,
      122.53,
      {
        azn: 16.13,
        varc: 0,
        strg_1_hy: 2.27,
        strg_2_hy: 3.15,
        tpt: 10.58,
      },
      19
    );
    console.log("result:", result);
    expect(result["a_mrgn"]).toBe(25.19);
    expect(result["a_mrgn_pct"]).toBe(20.56);
    expect(result["a_w_mrgn"]).toBe(24.31);
    expect(result["a_w_mrgn_pct"]).toBe(19.84);
    expect(result["a_p_mrgn"]).toBe(24.94);
    expect(result["a_p_mrgn_pct"]).toBe(20.35);
    expect(result["a_p_w_mrgn"]).toBe(24.06);
    expect(result["a_p_w_mrgn_pct"]).toBe(19.64);
  });
});
