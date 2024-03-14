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
const { write, read, append, readAsync } = pkg;
import { join } from "path";

const proxyAuth = {
  host: "127.0.0.1:8080",
  username: "",
  password: "",
};

const path = "./data/shop";

const main = async () => {
  const shopName = "idealo.de";

  append(
    join(path, shopName, "elapsedMatchTime.txt"),
    `Start: ${new Date()}\n`
  );
  const targetShopDomains = [
    { prefix: "e_", d: "ebay.de" },
    { prefix: "a_", d: "amazon.de" },
  ];
  const startTime = Date.now();
  const queue = new QueryQueue(6, proxyAuth);
  await queue.connect();
  let done = 0;

  const rawproducts = read(join(path, shopName, "products.json"), "json");

  if (!rawproducts) throw new Error(`No products for ${shopName}`);

  const shuffled = _.shuffle(rawproducts);

  const sliced = shuffled

  const babapromiseArr = [];

  setInterval(async () => {
    const endTime = Date.now();
    const elapsedTime = (endTime - startTime) / 1000 / 60;
    if (elapsedTime > 480) {
      write(
        join(path, shopName, "elapsedMatchTime.txt"),
        `${done} took ` +
          elapsedTime.toFixed(2) +
          " min" +
          "\n" +
          `End: ${new Date()}`
      );
      setTimeout(() => {
        throw new Error("Time is up");
      }, 5000);
    }
    console.log({
      ...(await queue.browserHealth()),
      status: `${done} from ${sliced.length}`,
    });
  }, 5000);

  for (let index = 0; index < sliced.length; index++) {
    const product = sliced[index];
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
      e_prc: 0,
      a_prc: 0,
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
        const _candidates = {
          "ebay.de": [],
          "amazon.de": [],
        };
        res.forEach(({ products, targetShop }) => {
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
        console.table(
          res.reduce((table, { products, targetShop }) => {
            table[targetShop.d] = {
              cnt: products.length,
              prc: targetShop.d.includes("amazon")
                ? result.a_prc
                : result.e_prc,
            };
            return table;
          }, {})
        );
        readAsync(join(path, shopName, "matched_products.json"), "json").then(
          (products) => {
            if (products) {
              products.push(result);
              write(join(path, shopName, "matched_products.json"), products);
            } else {
              write(join(path, shopName, "matched_products.json"), [result]);
            }
          }
        );
        write(join(path, shopName, `/raw/${slug(result.nm)}.json`), {
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
  if (res) {
    const endTime = Date.now();
    const elapsedTime = (endTime - startTime) / 1000 / 60;
    append(
      join(path, shopName, "elapsedMatchTime.txt"),
      `${done} from ${sliced.length}` +
        elapsedTime.toFixed(2) +
        " min" +
        "\n" +
        `End: ${new Date()}\n`
    );
    setTimeout(() => {
      throw new Error("Done in time");
    }, 8000);
  }
};

main();
