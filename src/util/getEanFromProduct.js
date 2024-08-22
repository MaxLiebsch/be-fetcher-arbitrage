
export function getEanFromProduct(product) {
  const { ean, eanList } = product;
  return ean || eanList?.[0];
}
