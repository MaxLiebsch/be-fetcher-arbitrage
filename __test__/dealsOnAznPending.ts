import { findPendingShops } from '../src/db/util/multiShopUtilities/findPendingShops.js';
import { PendingShopsWithBatch } from '../src/types/shops.js';
import { lockProductQueries } from '../src/db/util/multiShopUtilities/lockProductsQueryFns.js';
import { ObjectId } from '@dipmaxtech/clr-pkg';

async function main() {
  const productLimit = 3000;
  const { pendingShops, shops } = await findPendingShops('DEALS_ON_AZN');
  const stats = pendingShops.reduce<PendingShopsWithBatch>(
    (acc, { pending, shop }) => {
      acc[shop.d] = { shop, pending, batch: 0 };
      return acc;
    },
    {}
  );
  console.log('stats:', Object.keys(stats));

  const numberOfShops = pendingShops.length;
  console.log('numberOfShops:', numberOfShops);
  const productsPerShop = Math.round(productLimit / numberOfShops);
  console.log('productsPerShop:', productsPerShop);
  let limit = 0;
  pendingShops.map(async ({ shop, pending }) => {
    if (shop.d === 'idealo.de') {
      limit = Math.min(pending, productsPerShop);
      console.log(shop.d, ' limit:', limit);
    }
  });
  const { lock, set } = lockProductQueries['DEALS_ON_AZN'];

  const { query, options } = lock(
      new ObjectId('66c76dee5c74f136b98af654'),
      'idealo.de',
      limit,
      'none',
      true
    );
    console.log('options:', options)
  console.log('query:', JSON.stringify(query)
);
}

main().then();
