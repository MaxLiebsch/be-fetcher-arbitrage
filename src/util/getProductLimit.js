export function getProductLimit(productsLength, productLimit) {
  return productsLength < productLimit ? productsLength : productLimit;
}
