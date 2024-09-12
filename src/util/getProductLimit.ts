export function getProductLimit(productsLength: number, productLimit: number) {
  return productsLength < productLimit ? productsLength : productLimit;
}
