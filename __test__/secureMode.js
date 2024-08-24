import { proxyAuth } from "../src/constants.js";

import { getPage, mainBrowser } from "@dipmaxtech/clr-pkg";
import { getShop } from "../src/services/db/util/shops.js";

// const proxyAuth = {
//   host: "rp.proxyscrape.com:6060",
//   username: "4a2lvpvkrwf3zgi-country-de",
//   password: "myuk165vxsk5fdq",
// };

const secureMode = async () => {
  const browser = await mainBrowser({ id: "test" }, proxyAuth, '127.0.6533.119');
  
  const shop = await getShop("gamestop.de");
  const page = await getPage(
    browser,
    shop,
    1,
    [],
    shop.exceptions
  );
  // const page = await browser.newPage();
  await page.goto('https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&shippingMethod=2');

  
};

secureMode().then(() => console.log("Secure mode test passed"));
