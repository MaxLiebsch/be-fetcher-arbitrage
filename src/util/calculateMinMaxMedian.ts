import { Product, roundToTwoDecimals } from '@dipmaxtech/clr-pkg';

export function calculateMinMaxMedian(foundProducts: Product[]) {
  // Extract prices from foundProducts
  const prices = foundProducts
    .map((product) => product.price)
    .filter((price) => price !== undefined);

  if (prices.length === 0) {
    return { min: null, max: null, median: null };
  }

  // Sort the prices array
  prices.sort((a, b) => a - b);

  // Calculate Q1 and Q3
  const q1 = prices[Math.floor(prices.length / 4)];
  const q3 = prices[Math.floor(prices.length * (3 / 4))];
  const iqr = q3 - q1;

  // Define the reasonable range
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  // Filter out extreme values
  const filteredPrices = prices.filter(
    (price) => price >= lowerBound && price <= upperBound
  );

  if (filteredPrices.length === 0) {
    return { min: null, max: null, median: null };
  }

  // Sort the filtered prices array
  filteredPrices.sort((a, b) => a - b);

  // Calculate min and max prices from filtered prices
  const min = filteredPrices[0];
  const max = filteredPrices[filteredPrices.length - 1];

  // Calculate median price from filtered prices
  let median;
  const mid = Math.floor(filteredPrices.length / 2);
  if (filteredPrices.length % 2 === 0) {
    median = (filteredPrices[mid - 1] + filteredPrices[mid]) / 2;
  } else {
    median = filteredPrices[mid];
  }

  return {
    min: roundToTwoDecimals(min),
    max: roundToTwoDecimals(max),
    median: roundToTwoDecimals(median),
  };
}
