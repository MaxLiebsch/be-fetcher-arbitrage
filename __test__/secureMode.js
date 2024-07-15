import { proxyAuth } from "../src/constants.js";

import { getPage, mainBrowser } from "@dipmaxtech/clr-pkg";
import { getShop } from "../src/services/db/util/shops.js";

// const proxyAuth = {
//   host: "rp.proxyscrape.com:6060",
//   username: "4a2lvpvkrwf3zgi-country-de",
//   password: "myuk165vxsk5fdq",
// };

const secureMode = async () => {
  const browser = await mainBrowser({ id: "test" }, proxyAuth, "126.0.6478.55");
  const shop = await getShop("amazon.de");
  const page = await getPage(
    browser,
    shop,
    1,
    shop.resourceTypes["query"],
    shop.exceptions
  );
  // const page = await browser.newPage();
  await page.goto('https://www.amazon.de/dp/product/B0CSZ24B3P?language=de_DE');

  
};

secureMode().then(() => console.log("Secure mode test passed"));
