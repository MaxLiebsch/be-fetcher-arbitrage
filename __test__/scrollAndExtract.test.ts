import {
  CHROME_VERSIONS,
  ProductRecord,
  scrollAndExtract,
} from '@dipmaxtech/clr-pkg';
import { mainBrowser, openPage } from './secureMode';
import { proxyAuth } from '../src/constants';
import { Browser } from 'puppeteer-core';
import { shops } from '../src/shops';

describe('scrollAndExtract', () => {
  let browser: Browser | null = null;
  test('scroll And Extract products', async () => {
    browser = await mainBrowser(CHROME_VERSIONS[0], proxyAuth);
    const lnk = 'https://lyko.com/de/lifestyle-mehr/premium';
    const page = await openPage({
      lnk,
      proxyType: 'mix',
      browser,
    });

    if (!page) return;

    const hostname = new URL(lnk).hostname;
    const shop = shops[hostname];

    const products: any[] = [];

    const addProduct = async (product: ProductRecord) => {
      const index = products.findIndex((p) => p.link === product.link);
      if (index === -1) products.push(product);
    };

    await scrollAndExtract({
      page,
      addProduct,
      limit: 10,
      visible: false,
      shop,
      productContainerSelector: shop.productList[0].sel,
      paginationBtnSelector: shop.paginationEl[0].sel,
      waitUntil: shop.waitUntil,
      pageInfo: {
        link: lnk,
        name: 'Aesop',
      },
    });

    console.log(products.length);
  }, 600000);

  //   afterAll(async () => {
  //     if (browser) await browser.close();
  //   });
});
