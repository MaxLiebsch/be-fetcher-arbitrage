import { proxyAuth } from "../src/constants.js";
import {
  notifyProxyChange,
  getPage,
  mainBrowser,
  registerRequest,
  uuid,
  terminateConnection,
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

  const shop = await getShop("alza.de");
  const { exceptions } = shop;
  // const lnk = "https://www.browserleaks.com/ip";
  const lnk =
    "https://www.alza.de/amazon-echo-show-8-2nd-gen-charcoal-d6994664.htm";
  const requestId = uuid();
  const proxyType = "de";
  const page = await getPage({
    browser,
    shop,
    requestCount: 1,
    disAllowedResourceTypes: [],
    exceptions,
    proxyType,
    requestId,
    allowedHosts: shop.allowedHosts,
  });

  const originalGoto = page.goto;
  page.goto = async function (url, options) {
    console.log("Before: ", url, new Date().toISOString());
    if (proxyType === "de") {
      await notifyProxyChange(
        "de",
        url,
        requestId,
        Date.now(),
        shop.allowedHosts,
        2
      );
    } else {
      await registerRequest(
        url,
        requestId,
        shop.allowedHosts || [],
        Date.now()
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
