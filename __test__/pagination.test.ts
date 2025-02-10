import { describe, expect, test, beforeAll } from "@jest/globals";
import testParameters from "./shops/utils/testParamter.js";
import { shops } from "../src/shops.js";
import {
  buildNextPageUrl,
  checkForBlockingSignals,
  CHROME_VERSIONS,
  closePage,
  findPaginationAppendix,
  getPageNumberFromPagination,
  infinitSrollPgn,
  mainBrowser,
  paginationUrlSchemaBuilder,
  recursiveMoreButtonPgn,
  Shop,
} from "@dipmaxtech/clr-pkg";
import { shopFilter } from "../src/db/util/filter.js";
import { createPage, visitPage } from "./shops/utils/commonTests.js";
import { Browser } from "puppeteer";
import { proxyAuth } from "../src/constants.js";
import findPagination from "@dipmaxtech/clr-pkg/lib/util/crawl/findPagination.js";

const testCompleted = [
  // "reichelt.de",
  // "idealo.de",
  // "gamestop.de",
  // "bergfreunde.de",
  // "mueller.de",
  // "voelkner.de",
  // "alternate.de",
  // "cyberport.de",
  // "thalia.de",
  // "mindfactory.de",
  // "galeria.de",
  // "euronics.de",
  // "galaxus.de",
  // "notebooksbilliger.de",
  // "notino.de",
  // "flaconi.de",
  // "babymarkt.de",
  // "conrad.de",
  // "coolshop.de",
  // "proshop.de",
  // "saturn.de",
  // "digitalo.de",
  // "dm.de",
  // "fressnapf.de",
  // 'aldi-onlineshop.de',
  'allesfuerzuhause.de',
  // "alza.de",
  // 'rossmann.de',
  // 'pieper.de',
  // 'hornbach.de'
];

let activeShops: Shop[] = Object.values(shops).filter(
  (shop) => shopFilter(shop) && testCompleted.includes(shop.d)
);
let browser: Browser;
const pageNo = 2;
const maxPages = 5;
const maxRetries = 3;

describe("test pagination", () => {
  beforeAll(async () => {
    //@ts-expect-error - TS2339
    browser = await mainBrowser(proxyAuth, CHROME_VERSIONS[0]);
  }, 1000000);

  activeShops.forEach(async (shop) => {
    test(`${shop.d} pagination, urlbuilder`, async () => {
      const { paginationEl: paginationEls } = shop;
      const testParam = testParameters[shop.d];
      const { initialProductPageUrl, nextPageUrl } = testParam;
      if (!browser) throw Error("Browser not initialized");

      let retry = 1
      let done = false
      while(retry <= maxRetries && !done){
        // @ts-expect-error - TS2339
        const page = await createPage(browser, shop);
        console.log(`Shop ${shop.d} Try:`, retry);
        try {
          await visitPage(page, initialProductPageUrl, shop);
          const blocked = await checkForBlockingSignals(page, false, shop.mimic); 
          if(blocked){
            console.log(`${shop.d} is blocked`);
            retry++
            await closePage(page);
            continue;
          }
        } catch (error) {
          console.log('error:', error)
          retry++
          await closePage(page);
          continue;
        }
        await findPaginationAppendix(paginationEls, page);
        let { pagination, paginationEl } = await findPagination(
          page,
          paginationEls,
          {
            subCategory: 0,
            mainCategory: 0,
            pages: maxPages,
          }
        );
        if (paginationEl?.type === "pagination") {
          const result = await getPageNumberFromPagination(
            page,
            shop,
            paginationEl,
            pageNo,
            0
          );
          expect(result).toBeGreaterThan(0);
          console.log(`${shop.d} PageNumber result:`, result);
        }
        if (paginationEl.type === "infinite_scroll") {
          const result = await infinitSrollPgn({ page });
          console.log(`${shop.d} infinitSrollPgn result:`, result);
        }
        if (paginationEl.type === "recursive-more-button") {
          const { cnt, exists } = await recursiveMoreButtonPgn({
            page,
            limit: maxPages,
            sel: paginationEl.sel,
            wait: paginationEl.wait,
            waitUntil: shop.waitUntil,
            shop: shop,
          });
          expect(cnt).toBeGreaterThan(0);
          console.log(`${shop.d} recursiveMoreButtonPgn result:`, cnt, `if ${exists} then more pages exists`);
        }
        let nextUrl = buildNextPageUrl(
          testParam.initialProductPageUrl,
          shop.paginationEl[0].nav,
          pageNo
        );
        const paginationUrlSchema = shop.paginationEl.find(
          (el) => el.paginationUrlSchema
        );
        if (paginationUrlSchema)
          nextUrl = await paginationUrlSchemaBuilder(
            initialProductPageUrl,
            paginationEls,
            pageNo,
            undefined
          );
  
        expect(nextUrl).toBe(nextPageUrl);
        done = true
        await closePage(page);
      }
      if(!done){
        throw Error(`Shop ${shop.d} failed after ${maxRetries} retries`)
      }

    }, 1000000);
  });
});
