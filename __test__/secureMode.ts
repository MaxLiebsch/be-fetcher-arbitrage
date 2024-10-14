import { proxyAuth } from "../src/constants.js";
import {
  notifyProxyChange,
  getPage,
  mainBrowser,
  registerRequest,
  uuid,
  terminateConnection,
  registerRequestv3,
  CHROME_VERSIONS,
} from "@dipmaxtech/clr-pkg";
import { getShop } from "../src/db/util/shops.js";

const secureMode = async () => {
  const browser = await mainBrowser(proxyAuth, CHROME_VERSIONS[0]);
  const shopDomain = "dm.de";

  const shop = await getShop(shopDomain);
  if (!shop) return;

  const { exceptions } = shop;
  // const lnk = "https://www.browserleaks.com/ip";
  const lnk =
    "http://www.dm.de/lavera-shampoo-volumen-und-kraft-p4021457655113.html";
  const requestId = uuid();
  const proxyType = "de";
  const { page } = await getPage({
    browser,
    shop,
    host: shopDomain,
    requestCount: 1,
    disAllowedResourceTypes: [],
    exceptions,
  });

  const originalGoto = page.goto;
  page.goto = async function (url, options) {
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
  await page.goto("https://bot-detector.rebrowser.net/");
  // const page = await browser.newPage();
  // const result = await page.goto(lnk);
  // const status = result?.status();
  // if (status !== 200) {
  //   const response = await page.reload();
  //   const newStatus = response?.status();
  // }
  // await browser.close()
};

secureMode().then(() => console.log("Secure mode test passed"));
