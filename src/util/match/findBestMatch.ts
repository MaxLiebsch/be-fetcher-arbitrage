import {
  DbProductRecord,
  findBestMatch,
  Product,
  ProductRecord,
  reduceTargetShopCandidates,
} from '@dipmaxtech/clr-pkg';

export function findBestMatchFromProducts({
  products,
  product,
}: {
  products: Product[];
  product: DbProductRecord;
}) {
  const { foundProds: candidates } = reduceTargetShopCandidates(products);

  const bestMatch = findBestMatch(candidates, {
    procProd: product,
    rawProd: product as unknown as ProductRecord,
    dscrptnSegments: [],
    nmSubSegments: [],
  });

  return bestMatch;
}
