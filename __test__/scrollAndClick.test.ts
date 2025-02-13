import {
  CHROME_VERSIONS,
  getPageNumberFromPagination,
  getProductCount,
  ProductRecord,
  scrollAndClick,
} from '@dipmaxtech/clr-pkg';
import { proxyAuth } from '../src/constants.js';
import { Browser } from 'rebrowser-puppeteer';
import { shops } from '../src/shops.js';
import { mainBrowser } from './helper/getMainBrowser.js';
import { openPage } from './helper/getTestPage.js';

describe('scrollAndClick', () => {
  let browser: Browser | null = null;
  test('scroll And Click products', async () => {
    browser = await mainBrowser(CHROME_VERSIONS[0], proxyAuth);
    const lnk = 'https://www.coolshop.de/s/kampagne%3Doutlet/zeige-nur%3Dauf-lager/?sort=newest';
    const page = await openPage({
      lnk,
      proxyType: 'mix',
      browser,
    });

    if (!page) throw new Error('Page not found');
  
    const hostname = new URL(lnk).hostname.replace('www.', '');
    const shop = shops[hostname];

    if (!shop) throw new Error('Shop not found')

    const products: any[] = [];

    const addProduct = async (product: ProductRecord) => {
      const index = products.findIndex((p) => p.link === product.link);
      if (index === -1) products.push(product);
    };

    const { type, sel, wait, initialUrl, visible, endOfPageSel } =
      shop.paginationEl[0];
    const limit = { pages: 10 };

    const productCount = await getProductCount(page, shop.productList);
    const pageCount = await getPageNumberFromPagination(
      page,
      shop,
      shop.paginationEl[0],
      productCount === undefined ? null : productCount,
      1
    );
    await scrollAndClick({
      limit: limit.pages,
      page,
      sel,
      visible,
      endOfPageSel,
      wait,
      waitUntil: shop.waitUntil,
      pageCount,
    });

  

    console.log(products.length);
  }, 600000);

    afterAll(async () => {
      if (browser) await browser.close();
    });
});
