import {
  QueryQueue,
  getManufacturer,
  getPrice,
  segmentString,
  matchTargetShopProdsWithRawProd,
  prefixLink,
  queryShopClean,
  queryTargetShops,
  queryURLBuilder,
  reduceString,
} from "@dipmaxtech/clr-pkg";
import { findCrawledProductByName, getShops } from "../mongo.js";

import pkg from "fs-jetpack";
import parsePrice from "parse-price";
const { writeAsync } = pkg;

const proxyAuth = {
  host: "127.0.0.1:8080",
  username: "",
  password: "",
};

const matchWithIdealo = async (task) => {
  const queue = new QueryQueue(2, proxyAuth, task);

  await queue.connect();

  const rawProd = await findCrawledProductByName(
    "reichelt.de",
    "APRA 205-200-00 - Gleitschienenset für 19 Einschübe ab 3 HE, Traglast 60 kg"
  );
  if (!rawProd) throw new Error("Product not found");

  const {
    name: nm,
    description: dscrptn,
    category: ctgry,
    nameSub: nmSub,
    price: prc,
    promoPrice: prmPrc,
    image: img,
    link: lnk,
    createdAt,
    updatedAt,
    shop: s,
  } = rawProd;

  const mnfctr = getManufacturer(nm);
  const dscrptnSegments = segmentString(dscrptn);
  const nmSubSegments = segmentString(nmSub);

  let procProd = {
    s,
    ean: "",
    pblsh: false,
    a_vrfd: false,
    e_vrfd: false,
    ctgry,
    mnfctr: mnfctr.manufacturer,
    nm: mnfctr.name,
    e_prc: 0,
    a_prc: 0,
    img: prefixLink(img, s),
    lnk: prefixLink(lnk, s),
    prc: prmPrc
      ? parsePrice(getPrice(prmPrc ? prmPrc.replace(/\s+/g, "") : ""))
      : parsePrice(getPrice(prc ? prc.replace(/\s+/g, "") : "")),
    createdAt,
    updatedAt,
  };
  const nameSegments = segmentString(nm);
  const reducedName = reduceString(
    nm.replaceAll(/[\\(\\)]/g, ""),
    55 + mnfctr.manufacturer.length
  );

  const query = {
    product: {
      key: reducedName,
      value: reducedName,
    },
    category: "default",
  };
  console.log("query:", query);
  const shops = await getShops(["idealo.de", "ebay.de", "amazon.de"]);
  const shop = shops["idealo.de"];
  const targetShop = { prefix: "i_", d: "idealo.de" };
  const products = [];

  const addProduct = async (product) => {
    products.push(product);
  };

  const isFinished = async (interm) => {
    if (interm) {
      procProd = { ...procProd, ...interm.intermResult };
      if (interm.targetShops.length) {
        const _shops = queryTargetShops(
          interm.targetShops,
          queue,
          shops,
          query
        );
        const targetShopProds = await Promise.all(await _shops);
        const {
          procProd: arbitragePerMatchedTargetShopProduct,
        } = matchTargetShopProdsWithRawProd(targetShopProds, prodInfo);
        procProd = { ...procProd, ...arbitragePerMatchedTargetShopProduct };
        console.log("final targetshops > 0", procProd);
      } else {
        console.log("final targetshops = 0", procProd);
      }
    }
  };

  queue.pushTask(queryShopClean, {
    retries: 0,
    shop,
    addProduct,
    query,
    prio: 0,
    targetShop,
    product: {
      procProd,
      rawProd,
      dscrptnSegments,
      dscrptnSegments,
    },
    queue,
    extendedLookUp: true,
    limit: {
      mainCategory: 1,
      subCategory: 1,
      pages: 0,
    },
    isFinished,
    pageInfo: {
      link: shop.queryUrlSchema.length
        ? queryURLBuilder(shop.queryUrlSchema, query).url
        : shop.entryPoint,
      name: shop.d,
    },
  });
};

const task = {
  type: "LOOKUP_PRODUCTS",
  id: "lookup_shop_reichelt.de",
  shopDomain: "reichelt.de",
  productLimit: 2,
  executing: true,
  recurrent: true,
  completed: false,
  errored: false,
  startedAt: "2024-04-14T19:22:11.479Z",
  completedAt: "2024-04-14T14:12:23.386Z",
  createdAt: "2024-04-13T12:21:47.620Z",
  limit: {
    mainCategory: 0,
    subCategory: 0,
    pages: 0,
  },
  maintenance: false,
  lastCrawler: "love",
  reason: "COMPLETED",
  result: {
    products_cnt: 1000,
    endTime: "2024-04-14T14:12:22.735Z",
    elapsedTime: "1.11 h",
    crawledPages: 1992,
  },
  retry: 0,
  extendedLookUp: true,
  targetShops: [
    {
      d: "idealo.de",
      prefix: "i_",
    },
  ],
};

matchWithIdealo(task).then();
