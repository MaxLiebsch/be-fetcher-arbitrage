import { proxyAuth } from "../src/constants.js";
import { join } from "path";

import { getPage, mainBrowser } from "@dipmaxtech/clr-pkg";

const secureMode = async () => {
  const browser = await mainBrowser({}, proxyAuth, "122.0.6261.94");
  const page = await getPage(browser, 15);
  await page.goto("https://www.idealo.de/relocator/relocate?categoryId=16862&offerKey=b45bb5ba3afa95e30adf699204f54d2d&offerListId=200955121-A3C3B1FD75FCB6BE9BF9F859110B441F&pos=3&price=86.36&productid=200955118&sid=4640&type=offer");

};

secureMode().then(() => console.log("Secure mode test passed"));
