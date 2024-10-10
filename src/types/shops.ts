import { Shop } from "@dipmaxtech/clr-pkg";

export type ShopPick = Pick<
  Shop,
  "d" | "hasEan" | "ean" | "active" | "proxyType"
>;

export interface PendingShop {
  shop: ShopPick;
  pending: number;
}

export interface PendingShopWithBatch extends PendingShop {
  batch: number;
}

export type PendingShopsWithBatch = { [key: string]: PendingShopWithBatch };

export type PendingShops = PendingShop[];
