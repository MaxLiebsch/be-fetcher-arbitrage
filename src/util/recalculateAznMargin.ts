import {
  calculateAznArbitrage,
  DbProductRecord,
  getAznAvgPrice,
  roundToTwoDecimals,
} from '@dipmaxtech/clr-pkg';

export const recalculateAznMargin = (
  p: DbProductRecord,
  spotterSet: Partial<DbProductRecord>,
) => {
  const {
    prc: buyPrice,
    qty: buyQty,
    a_qty: sellQty,
    a_prc: sellPrice,
    costs,
    tax,
    a_useCurrPrice,
  } = p;

  if (costs && costs.azn > 0 && sellPrice && buyPrice && sellQty && buyQty) {
    const { a_prc, a_uprc, avgPrice } = getAznAvgPrice(
      p,
      sellPrice,
    );
    if (a_useCurrPrice === false) {
      costs.azn = roundToTwoDecimals((costs.azn / sellPrice) * avgPrice);
    }
    const arbitrage = calculateAznArbitrage(
      buyPrice * (sellQty! / buyQty), // EK
      sellPrice!, // VK
      costs!,
      tax,
    );
    Object.entries(arbitrage).forEach(([key, val]) => {
      (spotterSet as any)[key] = val;
    });
  }
};
