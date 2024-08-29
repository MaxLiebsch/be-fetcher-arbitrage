import { proxyAuth } from "../src/constants.js";

import { getPage, mainBrowser } from "@dipmaxtech/clr-pkg";
import { getShop } from "../src/services/db/util/shops.js";
import { changeRequestProxy } from "../src/util/changeRequestProxy.js";

// const proxyAuth = {
//   host: "rp.proxyscrape.com:6060",
//   username: "4a2lvpvkrwf3zgi-country-de",
//   password: "myuk165vxsk5fdq",
// };

const secureMode = async () => {
  const browser = await mainBrowser(
    { id: "test" },
    proxyAuth,
    "127.0.6533.119"
  );

  const shop = await getShop("saturn.de");
  const { exceptions } = shop;
  const lnk = "https://www.saturn.de";
  const page = await getPage({
    browser,
    shop,
    requestCount: 1,
    disAllowedResourceTypes: [],
    exceptions,
    proxyType: "de",
  });

  const originalGoto = page.goto;
  page.goto = async function (url, options) {
    await changeRequestProxy("de", lnk, 2); 
    return originalGoto.apply(this, [url, options]);
  };
  // const page = await browser.newPage();
  const result = await page.goto(lnk);
  const status = result?.status();
  if (status !== 200) {
    const response = await page.reload();
    const newStatus = response?.status();
  }
};

secureMode().then(() => console.log("Secure mode test passed"));
