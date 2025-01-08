import {
  calculateEbyArbitrage,
  DbProductRecord,
  findMappedCategory,
  roundToTwoDecimals,
} from '@dipmaxtech/clr-pkg';

export const recalculateEbyMargin = (
  p: DbProductRecord,
  spotterSet: Partial<DbProductRecord>
) => {
  let mappedCategory = null;
  const {
    e_pRange,
    ebyCategories,
    prc: buyPrice,
    qty: buyQty,
    e_qty: sellQty,
  } = p;
  const sellPrice = e_pRange?.median!;
  if (ebyCategories!.every((cat) => typeof cat === 'number')) {
    mappedCategory = findMappedCategory(ebyCategories); // { category: "Drogerie", id: 322323, ...}
    if (mappedCategory) {
      spotterSet['ebyCategories'] = [
        {
          id: mappedCategory.id,
          createdAt: new Date().toISOString(),
          category: mappedCategory.category,
        },
      ];
    }
  } else if (ebyCategories!.length > 0) {
    const categories = [ebyCategories![0].id];
    mappedCategory = findMappedCategory(categories);
  }
  if (mappedCategory && sellPrice) {
    spotterSet['e_uprc'] = roundToTwoDecimals(sellPrice / sellQty!);
    let ebyArbitrage = calculateEbyArbitrage(
      mappedCategory,
      sellPrice, //VK
      buyPrice * (sellQty! / buyQty) //EK  //QTY Zielshop/QTY Herkunftsshop
    );
    if (ebyArbitrage) {
      Object.entries(ebyArbitrage).forEach(([key, val]) => {
        (spotterSet as any)[key] = val;
      });
    }
  }
};
