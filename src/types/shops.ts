import { Shop } from "@dipmaxtech/clr-pkg";

export interface PendingShop {
  shop: Pick<Shop, "d" | "hasEan" | "ean">;
  pending: number;
}

export interface PendingShopWithBatch extends PendingShop {
  batch: number;
}

export type PendingShopsWithBatch = { [key: string]: PendingShopWithBatch };

export type PendingShops = PendingShop[];
