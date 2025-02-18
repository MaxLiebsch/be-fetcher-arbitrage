import { proxyAuth } from '../src/constants.js';
import {
  notifyProxyChange,
  getPage,
  registerRequest,
  uuid,
  CHROME_VERSIONS,
} from '@dipmaxtech/clr-pkg';
import { updateShops } from '../src/db/util/shops.js';
import { shops } from '../src/shops.js';
import { mainBrowser } from './helper/getMainBrowser.js';
import AllowedDomainService from '../src/model/AllowedDomainService.js';

const secureMode = async () => {
  await updateShops(shops);
  const browser = await mainBrowser(CHROME_VERSIONS[0], proxyAuth);
  const shopDomain = 'galaxus.de';
  const proxyType = 'mix';
  const shop = shops[shopDomain];
  if (!shop) return;
  
  const allowedDomainService = new AllowedDomainService()
  await allowedDomainService.addAll()
  await allowedDomainService.setupDomains([shopDomain, ...(shop?.allowedHosts || [])])
  console.log('allowedDomains:', await allowedDomainService.allowedDomains())

  const { exceptions, resourceTypes } = shop;
  const lnk = 'https://www.galaxus.de/de/sale';
  const requestId = uuid();
  // const page = await browser.newPage();
  const { page } = await getPage({
    //@ts-ignore
    browser,
    shop,
    host: shopDomain,
    requestCount: 11,
    proxyType,
    disAllowedResourceTypes: [],
    exceptions,
  });

  const originalGoto = page.goto;
  page.goto = async function (url, options) {
    await registerRequest(url, requestId, shop.allowedHosts || [], Date.now());
    await notifyProxyChange(
      proxyType,
      url,
      requestId,
      Date.now(),
      shop.allowedHosts
    );
    return originalGoto.apply(this, [url, options]);
  };
  await page.goto(lnk, { timeout: 60000 });
  // const status = result?.status();
  // if (status !== 200) {
  //   const response = await page.reload();
  //   const newStatus = response?.status();
  // }
  // await browser.close()
};

secureMode().then(() => console.log('Secure mode test passed'));
