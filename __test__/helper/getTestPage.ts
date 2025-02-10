import { Browser } from 'rebrowser-puppeteer';
import { shops } from '../../src/shops';
import {
  notifyProxyChange,
  getPage,
  registerRequest,
  uuid,
  ProxyType,
} from '@dipmaxtech/clr-pkg';

export const openPage = async ({
  lnk,
  proxyType,
  browser,
}: {
  lnk: string;
  proxyType: ProxyType;
  browser: Browser;
}) => {
  const hostname = new URL(lnk).hostname;
  const shop = shops[hostname];
  if (!shop) return;
  console.log('shop:', shop.d);

  const { exceptions, resourceTypes } = shop;
  const requestId = uuid();
  const { page } = await getPage({
    //@ts-ignore
    browser,
    shop,
    host: hostname,
    requestCount: 1,
    proxyType,
    disAllowedResourceTypes: resourceTypes['crawl'],
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
  return page;
};
