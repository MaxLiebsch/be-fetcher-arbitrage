import { Shop, TaskTypes } from '@dipmaxtech/clr-pkg';
import AllowedDomainService from '../model/AllowedDomainService.js';
import { ShopPick } from '../types/shops.js';

export async function setupAllowedDomainsBasedOnShops(shops: ShopPick[], taskType: TaskTypes) {
  const allowedDomainService = new AllowedDomainService();
  await allowedDomainService.setDomainsBasedOnShops(shops, taskType);
}
