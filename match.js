import {
  QueryQueue,
  addBestMatchToProduct,
  getManufacturer,
  getPrice,
  getProductCandidates,
  getProductNameSplitAdv,
  prefixLink,
  queryShopClean,
  queryURLBuilder,
  slug,
} from "@dctrbx/mediprixpackage";
import { shops } from "./shops.js";
import _ from "underscore";
import pkg from "fs-jetpack";
import parsePrice from "parse-price";
const { write, read } = pkg;
import "dotenv/config";
import { config } from "dotenv";

config({ path: `.env.${process.env.NODE_ENV}` });

const proxyAuth = {
  host: process.env.PROXY_HOST,
  username: process.env.PROXY_USERNAME,
  password: process.env.PROXY_PASSWORD,
};

const main = async () => {
  const targetShopDomains = [
    { prefix: "e_", d: "ebay.de" },
    { prefix: "a_", d: "amazon.de" },
  ];
  const startTime = Date.now();
  const queue = new QueryQueue(6, proxyAuth);
  await queue.connect();
  let done = 0;

  const rawproducts = read("./data/shop/products.json", "json");




  if (!rawproducts) return;

  const babapromiseArr = [];

  setInterval(async () => {
    const endTime = Date.now();
    const elapsedTime = (endTime - startTime) / 1000 / 60;
    if (elapsedTime > 480) {
      write(
        "./data/shop/elapsedMatchTime.txt",
        `${done} took ` + elapsedTime.toFixed(2) + " min"
      );
      process.exit(0);
    }
    console.log("BrowserHealth", await queue.browserHealth());
    console.log(done, " products matched from", rawproducts.length);
  }, 5000);

  for (let index = 0; index < rawproducts.length; index++) {
    const product = rawproducts[index];
    const {
      name: nm,
      description: dscrptn,
      category: ctgry,
      nameSub: nmSub,
      price: prc,
      image: img,
      link: lnk,
      createdAt,
      updatedAt,
      shop: s,
    } = product;

    const mnfctr = getManufacturer(nm);
    const dscrptnSplit = getProductNameSplitAdv(product.description);
    const nmSubSplit = [];
    let result = {
      s,
      ean: "",
      pblsh: false,
      vrfd: false,
      ctgry,
      mnfctr: mnfctr.manufacturer,
      nm: mnfctr.name,
      img: prefixLink(img, s),
      lnk: prefixLink(lnk, s),
      prc: parsePrice(getPrice(prc ?? 0)),
      createdAt,
      updatedAt,
    };
    const query = {
      product: {
        key: product.name,
        value: product.name,
      },
      category: "default",
    };

    const _shops = targetShopDomains.map(
      (targetShop) =>
        new Promise((res, rej) => {
          const products = [];
          const addProduct = (product) => {
            products.push(product);
          };
          const isFinished = () => res({ products, targetShop });

          const shop = shops[targetShop.d];
          queue.pushTask(queryShopClean, {
            retries: 0,
            shop,
            addProduct,
            query,
            prio: 0,
            isFinished,
            pageInfo: {
              link: shop.queryUrlSchema.length
                ? queryURLBuilder(shop.queryUrlSchema, query).url
                : shop.entryPoint,
              name: shop.d,
            },
          });
        })
    );

    babapromiseArr.push(
      Promise.all(_shops).then((res) => {
        console.log('res:', res.map(({products,targetShop})=>{
            return `${products.length} from shop ${targetShop.d}`
        }))
        const _candidates = {
          "ebay.de": [],
          "amazon.de": [],
        };
        res.map(({ products, targetShop }) => {
          if (products && products.length) {
            const { nm, prc, mnfctr } = result;
            const candidates = getProductCandidates(products);
            _candidates[targetShop.d] = candidates.map((candidate) => {
              return {
                nm: candidate.name,
                prc: parsePrice(getPrice(candidate.price)),
              };
            });
            const arbitrage = addBestMatchToProduct(candidates, targetShop, {
              nm,
              nmSubSplit,
              prc,
              dscrptnSplit,
              mnfctr,
            });
            result = { ...result, ...arbitrage };
          }
        });
        done += 1;
        write(`./data/shop/raw/${slug(result.nm)}.json`, {
          s: result.s,
          nm: result.nm,
          mnfctr: result.mnfctr,
          prc: result.prc,
          _candidates,
        });
        return result;
      })
    );
  }
  const res = await Promise.all(babapromiseArr);
  const endTime = Date.now();
  const elapsedTime = (endTime - startTime) / 1000 / 60;
  write("./data/shop/matching_result.json", res);
  write(
    "./data/shop/elapsedMatchTime.txt",
    `${done} took ` + elapsedTime.toFixed(2) + " min"
  );

};

main();
