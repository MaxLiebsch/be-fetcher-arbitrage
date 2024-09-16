import {
  calculateEbyArbitrage,
  DbProductRecord,
  findMappedCategory,
  roundToTwoDecimals,
} from "@dipmaxtech/clr-pkg";

export const recalculateEbyMargin = (
  p: DbProductRecord,
  spotterSet: Partial<DbProductRecord>
) => {
  let mappedCategory = null;
  if (p.ebyCategories!.every((cat) => typeof cat === "number")) {
    mappedCategory = findMappedCategory(p.ebyCategories); // { category: "Drogerie", id: 322323, ...}
    if (mappedCategory) {
      spotterSet["ebyCategories"] = [
        {
          id: mappedCategory.id,
          createdAt: new Date().toISOString(),
          category: mappedCategory.category,
        },
      ];
    }
  } else if (p.ebyCategories!.length > 0) {
    mappedCategory = findMappedCategory([p.ebyCategories![0].id]);
  }
  if (mappedCategory) {
    const { prc: buyPrice, qty: buyQty, e_qty: sellQty, e_prc: sellPrice } = p;

    spotterSet["e_uprc"] = roundToTwoDecimals(sellPrice! / sellQty!);
    let ebyArbitrage = calculateEbyArbitrage(
      mappedCategory,
      sellPrice!, //VK
      buyPrice * (sellQty! / buyQty) //EK  //QTY Zielshop/QTY Herkunftsshop
    );
    if (ebyArbitrage) {
      Object.entries(ebyArbitrage).forEach(([key, val]) => {
        (spotterSet as any)[key] = val;
      });
    }
  }
};
