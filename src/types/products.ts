import { DbProductRecord } from '@dipmaxtech/clr-pkg';
import { PendingShops, ShopPick } from './shops.js';

export interface ProductWithShop {
  shop: ShopPick;
  product: DbProductRecord;
}

export type ProductsWithShop = ProductWithShop[];

export type ProductsAndShop = {
  products: ProductWithShop[];
  shops: PendingShops;
};
