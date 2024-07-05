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
  const shop = await getShop("alza.de");
  const page = await getPage(
    browser,
    shop,
    1,
    shop.resourceTypes["crawl"],
    shop.exceptions
  );

  await page.goto("https://www.alza.de/buero-schreibwaren");
  // const res = await fetch(
  //   "http://127.0.0.1:8080/change-proxy?proxy=gb"
  // );
  // console.log('res:', res.status)
  // if (res.ok) {
  //   const page2 = await getPage(browser, {}, 1);
  //   await page2.goto("https://ipinfo.io");
  // }
  // const page3 = await getPage(browser, 4)
  // const page4 = await getPage(browser, 1)
  // await page3.goto("https://bot.sannysoft.com/");
  // await page.goto("https://www.mindfactory.de");
  // await page2.goto("https://deviceandbrowserinfo.com/info_device");
  // await page4.goto("https://fv.pro/");
  // await page4.goto("https://www.dnsleaktest.com");
  // await page
  //   .screenshot({
  //     type: "png",
  //     path: join(process.cwd(), `/data/shop/debug/bottest.png`),
  //     fullPage: true,
  //   })
  //   .catch((e) => {});
  // await new Promise((resolve) => setTimeout(resolve, 5000));
  // await page2
  //   .screenshot({
  //     type: "png",
  //     path: join(process.cwd(), `/data/shop/debug/deviceinfo.png`),
  //     fullPage: true,
  //   })
  //   .catch((e) => {});

  // const platformInfo = await page.evaluate(async () => {
  //   return await navigator.userAgentData.getHighEntropyValues([
  //     "architecture",
  //     "bitness",
  //     "model",
  //     "platformVersion",
  //     "uaFullVersion",
  //     "fullVersionList",
  //   ]);
  // });
  // console.log(platformInfo)
};

secureMode().then(() => console.log("Secure mode test passed"));
