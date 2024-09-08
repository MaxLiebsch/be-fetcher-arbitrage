import { calculateAznArbitrage, roundToTwoDecimals } from "@dipmaxtech/clr-pkg";

export const recalculateAznMargin = (p, spotterSet) => {
  const {
    prc: buyPrice,
    qty: buyQty,
    a_qty: sellQty,
    a_prc: sellPrice,
    costs,
    tax,
  } = p;

  spotterSet["a_uprc"] = roundToTwoDecimals(sellPrice / sellQty);

  const arbitrage = calculateAznArbitrage(
    buyPrice * (sellQty / buyQty), // EK
    sellPrice, // VK
    costs,
    tax
  );
  Object.entries(arbitrage).forEach(([key, val]) => {
    spotterSet[key] = val;
  });
};
