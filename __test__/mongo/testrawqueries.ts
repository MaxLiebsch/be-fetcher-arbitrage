import {
  countPendingProductsForCrawlEanQuery,
  countPendingProductsQueryEansOnEbyQuery,
} from '../../src/db/util/queries.js';

function main() {
  const result = countPendingProductsQueryEansOnEbyQuery('notion.de');
  console.log('result:', JSON.stringify(result, null, 2));
}

main();
