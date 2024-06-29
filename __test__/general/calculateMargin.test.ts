import { calculateAznArbitrage } from "@dipmaxtech/clr-pkg";
import { describe, expect, test, beforeAll } from "@jest/globals";

describe("calculate arbitrage", () => {
  test("#1", () => {
    const result = calculateAznArbitrage(
      454,
      717.43,
      {
        azn: 64.39,
        varc: 0,
        strg_1_hy: 0.01,
        strg_2_hy: 0.01,
        tpt: 4.37,
      },
      19
    );
    expect(result["a_mrgn"]).toBe(152.6);
    expect(result["a_mrgn_pct"]).toBe(25.3);
    expect(result["a_p_mrgn"]).toBe(152.35);
    expect(result["a_p_mrgn_pct"]).toBe(25.3);
    expect(result["a_p_w_mrgn"]).toBe(152.35);
    expect(result["a_p_w_mrgn_pct"]).toBe(25.3);
    expect(result["a_w_mrgn"]).toBe(152.6);
    expect(result["a_w_mrgn_pct"]).toBe(25.3);
  });
});
