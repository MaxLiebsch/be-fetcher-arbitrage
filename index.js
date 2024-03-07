import {
  CrawlerQueue,
  crawlShopClean,
} from "@dctrbx/mediprixpackage";

import { shops } from "./shops.js";
import pkg from "fs-jetpack";
const { write, read } = pkg;

const proxyAuth = {
  host: "rp.proxyscrape.com:6060",
  username: "4a2lvpvkrwf3zgi-country-de",
  password: "myuk165vxsk5fdq",
};

async function main() {
  const queue = new CrawlerQueue(4, proxyAuth);
  await queue.connect();
  const shopDomain = "idealo.de";
  const products = [];
  const startTime = Date.now();

  const addProduct = (product) => {
    const found = products.find((_product) => _product.name === product.name);
    if (!found) {
      const productStr = read("./data/shop/products.json");
      if (productStr) {
        const _products = JSON.parse(productStr);
        _products.push(product);
        write("./data/shop/products.json", JSON.stringify(_products));
      } else {
        write("./data/shop/products.json", JSON.stringify([product]));
      }
      products.push(product);
      const endTime = Date.now();
      const elapsedTime = (endTime - startTime) / 1000 / 60;
      if (products.length > 10000 || elapsedTime > 480) {
        write(
          "./data/shop/elapsedTime.txt",
          `${products.length} took ` + elapsedTime.toFixed(2) + " min"
        );
        process.exit(0);
      }
    }
  };
  queue.pushTask(crawlShopClean, {
    parent: null,
    parentPath: "",
    shop: shops[shopDomain],
    addProduct,
    queue,
    prio: 0,
    pageInfo: { link: "https://www.idealo.de", name: "Idealo" },
  });

  setInterval(async () => {
    const endTime = Date.now();
    const elapsedTime = (endTime - startTime) / 1000 / 60;
    if (products.length > 10000 || elapsedTime > 480) {
      write(
        "./data/shop/elapsedTime.txt",
        `${products.length} took ` + elapsedTime.toFixed(2) + " min"
      );
      process.exit(0);
    }
    console.log("BrowserHealth", await queue.browserHealth());
    console.log("Queue is idle:", queue.idle());
  }, 5000);
}

main();
