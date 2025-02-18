import {
  getCurrentAllowedDomains,
  globalEventEmitter,
  setupAllowedDomains,
  Shop,
  TaskTypes,
} from '@dipmaxtech/clr-pkg';
import { log } from '../util/logger.js';
import { ShopPick } from '../types/shops.js';
import { getAllowedDomains } from '../db/util/settings.js';

export default class AllowedDomainService {
  private allowedDomains: string[] = [];

  public async addAll() {
    try {
      const allowedDomains = await getAllowedDomains();
      this.allowedDomains = allowedDomains;
      await setupAllowedDomains(allowedDomains);
      globalEventEmitter.emit('set-allowed-domains', allowedDomains);
    } catch (error) {
      console.error(error);
    }
  }

  public async setupDomains(domains: string[]) {
    try {
      this.allowedDomains = domains;
      await setupAllowedDomains(domains);
      globalEventEmitter.emit('set-allowed-domains', domains);
    } catch (error) {
      console.error(error);
    }
  }

  public async retrieveAllowDomains() {
    try {
      return await getCurrentAllowedDomains();
    } catch (error) {
      console.error(error);
    }
  }

  public async setDomainsBasedOnShops(shops: ShopPick[], taskType: TaskTypes) {
    const domains = shops
      .map((shop) => [shop.d, ...(shop.allowedHosts || [])])
      .flat();
    log(
      `Setting allowed domains for ${taskType}, ${domains
        .map((domain) => `'${domain}'`)
        .join(', ')}`
    );
    this.allowedDomains = domains;
    await this.setupDomains(domains);
    globalEventEmitter.emit('set-allowed-domains', domains);
  }

  public getAllowedDomains() {
    return this.allowedDomains;
  }
}
