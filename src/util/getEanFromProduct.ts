import { DbProductRecord } from '@dipmaxtech/clr-pkg';

export function getEanFromProduct(product: DbProductRecord) {
  const { eanList } = product;
  return eanList && eanList.length ? eanList[0] : null;
}
