/*
  calculatePageLimit is a helper function that calculates the number of pages needed to display all the products.

*/

const calculatePageLimit = (
  currentPageLimit: number,
  estimatedProducts: number,
  foundProducts: number
) => {
  const productsPerPage = Math.ceil(foundProducts / currentPageLimit);
  const newPageLimit = Math.ceil(estimatedProducts / productsPerPage);
  return newPageLimit;
};

export default calculatePageLimit;
