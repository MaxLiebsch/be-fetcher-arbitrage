import {
  CHROME_VERSIONS,
  ProductRecord,
  scrollAndExtract,
} from '@dipmaxtech/clr-pkg';
import { proxyAuth } from '../src/constants';
import { Browser } from 'rebrowser-puppeteer';
import { shops } from '../src/shops';
import { mainBrowser } from './helper/getMainBrowser.js';
import { openPage } from './helper/getTestPage.js';

describe('scrollAndExtract', () => {
  let browser: Browser | null = null;
  test('scroll And Extract products', async () => {
    browser = await mainBrowser(CHROME_VERSIONS[0], proxyAuth);
    const lnk = process.argv[1];
    const page = await openPage({
      lnk,
      proxyType: 'mix',
      browser,
    });

    if (!page) throw new Error('Shop not found');

    const hostname = new URL(lnk).hostname.replace('www.', '');
    const shop = shops[hostname];

    if (!shop) throw new Error('Shop not found');

    const products: any[] = [];

    const addProduct = async (product: ProductRecord) => {
      const index = products.findIndex((p) => p.link === product.link);
      if (index === -1) products.push(product);
    };

    await scrollAndExtract({
      page,
      addProduct,
      limit: 10,
      shop,
      productContainerSelector: shop.productList[0].sel,
      paginationEl: shop.paginationEl[0],
      waitUntil: shop.waitUntil,
      pageInfo: {
        link: lnk,
        name: 'Aesop',
      },
    });

    console.log(products.length);
  }, 600000);

  afterAll(async () => {
    if (browser) await browser.close();
  });
});
