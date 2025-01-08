import { proxyAuth } from '../src/constants.js';
import {
  notifyProxyChange,
  getPage,
  registerRequest,
  uuid,
  CHROME_VERSIONS,
} from '@dipmaxtech/clr-pkg';
import os from 'os';
import { getShop, updateShops } from '../src/db/util/shops.js';
import { shops } from '../src/shops.js';
import puppeteer from 'puppeteer-core';
import {
  VersionProvider,
  Versions,
} from '@dipmaxtech/clr-pkg/lib/util/versionProvider.js';

export const mainBrowser = async (
  version: Versions,
  proxyAuth?: { host: string }
) => {
  const args = [
    '--no-sandbox',
    '--lang=de',
    '--disable-gpu',
    '--disable-webrtc',
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--disable-extensions',
    '--disable-breakpad',
    '--safebrowsing-disable-auto-update',
    '--disable-sync',
    '--disable-default-apps',
    '--disable-client-side-phishing-detection',
    '--metrics-recording-only',
    '--disable-hang-monitor',
    '--webrtc-ip-handling-policy=disable_non_proxied_udp',
    '--force-webrtc-ip-handling-policy',
    '--start-maximized',
  ];

  if (proxyAuth) {
    const proxySetting = '--proxy-server=' + proxyAuth.host;
    args.push(proxySetting);
  }

  const provider = VersionProvider.getSingleton();
  provider.switchVersion(version);

  const options: any = {
    headless: process.env.HEADLESS === 'true' ? true : false,
    devtools: process.env.DEV_TOOLS === 'true' ? true : false,
    args,
    defaultViewport: null,
    timeout: 600000,
    protocolTimeout: 60000,
    ignoreDefaultArgs: ['--enable-automation'],
  };

  if (os.platform() === 'win32') {
    options['executablePath'] =
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  } else if (os.platform() === 'linux') {
    options['executablePath'] = '/usr/bin/google-chrome';
  }

  const browser = await puppeteer.launch(options);

  console.log('Browser Version: ', await browser.version());
  return browser;
};

const secureMode = async () => {
  const sleep = (delay: number) =>
    new Promise((resolve) => setTimeout(resolve, delay));
  await updateShops(shops);
  const browser = await mainBrowser(CHROME_VERSIONS[0], proxyAuth);
  const shopDomain = 'otto.de';
  const proxyType = 'de'
  const shop = await getShop(shopDomain);
  if (!shop) return;

  const { exceptions } = shop;
  const lnk = 'https://www.otto.de/p/lomac-hebeanlage-stand-wc-mit-pumpe-gestolette-1010-keramik-wc-mit-hebeanlage-S0R7T083/#variationId=S0R7T083R0FY';
  const requestId = uuid();
  const { page } = await getPage({
    //@ts-ignore
    browser,
    shop,
    host: shopDomain,
    requestCount: 1,
    proxyType,
    disAllowedResourceTypes: shop.resourceTypes['product'],
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
    if (shop.proxyType !== 'mix') {
    }
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
