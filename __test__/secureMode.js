import { proxyAuth } from "../src/constants.js";
import { join } from "path";

import { getPage, mainBrowser } from "@dipmaxtech/clr-pkg";

const secureMode = async () => {
  const browser = await mainBrowser({}, proxyAuth, "124.0.6367.60");
  const page = await getPage(browser, 1);
  // const page2 = await getPage(browser, 1);
  // const page3 = await getPage(browser, 4)
  // const page4 = await getPage(browser, 1)
  // await page3.goto("https://bot.sannysoft.com/");
  // await page.goto("https://bot.incolumitas.com/");
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
