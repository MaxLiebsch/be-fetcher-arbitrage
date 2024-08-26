import { proxyAuth } from "../src/constants.js";

import { getPage, mainBrowser } from "@dipmaxtech/clr-pkg";
import { getShop } from "../src/services/db/util/shops.js";

// const proxyAuth = {
//   host: "rp.proxyscrape.com:6060",
//   username: "4a2lvpvkrwf3zgi-country-de",
//   password: "myuk165vxsk5fdq",
// };

const secureMode = async () => {
  const browser = await mainBrowser({ id: "test", proxyType: "de" }, proxyAuth, '127.0.6533.119');
  
  const shop = await getShop("saturn.de");
  const page = await getPage(
    browser,
    shop,
    1,
    [],
    shop.exceptions
  );
  // const page = await browser.newPage();
  const result = await page.goto('https://www.saturn.de/de/product/_neff-d65ifn1s0-dunstabzugshaube-590-mm-breit-433-mm-tief-2903408.html');
  const status = result?.status();
  if(status !== 200) {
    const response = await page.reload();
    const newStatus = response?.status()
  }
};

secureMode().then(() => console.log("Secure mode test passed"));
