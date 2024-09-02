import { proxyAuth } from "../src/constants.js";
import {
  notifyProxyChange,
  getPage,
  mainBrowser,
  registerRequest,
  uuid,
  terminateConnection,
  registerRequestv3,
} from "@dipmaxtech/clr-pkg";
import { getShop } from "../src/services/db/util/shops.js";

// const proxyAuth = {
//   host: "rp.proxyscrape.com:6060",
//   username: "4a2lvpvkrwf3zgi-country-de",
//   password: "myuk165vxsk5fdq",
// };

const secureMode = async () => {
  const browser = await mainBrowser(
    //@ts-ignore
    { id: "test", type: "CRAWL_EAN", productLimit: 1, statistics: {} },
    proxyAuth,
    "127.0.6533.119"
  );

  const shop = await getShop("dm.de");
  const { exceptions } = shop;
  // const lnk = "https://www.browserleaks.com/ip";
  const lnk =
    "http://www.dm.de/lavera-shampoo-volumen-und-kraft-p4021457655113.html";
  const requestId = uuid();
  const proxyType = "de";
  const page = await getPage({
    browser,
    shop,
    requestCount: 1,
    disAllowedResourceTypes: [],
    exceptions,
  });

  const originalGoto = page.goto;
  page.goto = async function (url, options) {
    console.log("Before: ", url, new Date().toISOString());
    await registerRequest(url, requestId, shop.allowedHosts || [], Date.now());
    if (proxyType === "de") {
      await notifyProxyChange(
        "de",
        url,
        requestId,
        Date.now(),
        shop.allowedHosts
      );
    }
    return originalGoto.apply(this, [url, options]);
  };
  // const page = await browser.newPage();
  const result = await page.goto(lnk);
  const status = result?.status();
  if (status !== 200) {
    const response = await page.reload();
    const newStatus = response?.status();
  }
  // await browser.close()
};

secureMode().then(() => console.log("Secure mode test passed"));
