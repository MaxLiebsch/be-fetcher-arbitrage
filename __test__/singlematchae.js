import {
  getManufacturer,
  prefixLink,
  queryTargetShops,
  segmentString,
  reduceString,
  safeParsePrice,
  targetRetailerList,
  QueryQueue,
} from "@dipmaxtech/clr-pkg";
import { getShops } from "../src/service/db/util/shops.js";
import { CONCURRENCY, proxyAuth } from "../src/constants.js";

const rawProd = {
  _id: {
    $oid: "664ca108904e916f38272d65",
  },
  link: "https://www.reichelt.de/digital-mikroskop-pce-dhm-10-pce-dhm-10-p358155.html?&trstct=pol_1&nbc=1",
  category: ["Werkstatt und Löttechnik", "Endoskope, Mikroskope"],
  createdAt: "2024-05-21T13:26:32.162Z",
  description:
    "Typ: Digital Mikroskop Technologie: 20x - 500x Ausführung: mit 3´´ Monitor Approbation: 0,5 MP Batterietyp: Li-Ion-Akku Breite: 130 mm Höhe: 112 mm Tiefe: 28 mm Farbe: schwarz",
  image: "/resize/150/150/web/artikel_ws/D100/PCE_DHM_10_01.jpg?20210317",
  locked: false,
  matched: true,
  name: "PCE DHM 10 - Digital-Mikroskop",
  nameSub: "",
  price: "243,54",
  prime: false,
  promoPrice: "",
  redirect_link: "",
  shop: "reichelt.de",
  updatedAt: "2024-05-21T13:27:58.608Z",
  van: "PCE DHM 10",
  vendor: "",
  vendorLink: "",
  year: "",
  taskId: "",
  candidates: [
    {
      nm: "PCE PCE-RAM 10",
      lnk: "https://www.idealo.de/preisvergleich/OffersOfProduct/201978968_-pce-ram-10-pce.html",
      nmSegments: ["pce", "pce", "ram", "10"],
      prc: 449,
    },
    {
      nm: "Circuitco BeagleBone Black",
      lnk: "https://www.idealo.de/preisvergleich/OffersOfProduct/3895268_-beaglebone-black-circuitco.html",
      nmSegments: ["circuitco", "beaglebone", "black"],
      prc: 77.99,
    },
  ],
  dscrptnSegments: [
    "0.5 P",
    "130 mm",
    "112 mm",
    "28 mm",
    "typ:",
    "digital",
    "mikroskop",
    "technologie:",
    "20x",
    "500x",
    "ausführung:",
    "mit",
    "3´´",
    "monitor",
    "approbation:",
    "batterietyp:",
    "li",
    "ion",
    "akku",
    "breite:",
    "höhe:",
    "tiefe:",
    "farbe:",
    "schwarz",
  ],
  matchedAt: "2024-05-21T13:27:58.608Z",
  mnfctr: "PCE",
  nmSubSegments: [""],
  query: "PCE DHM 10 - Digital-Mikroskop PCE-DHM 10",
};

const task = {
  extendeedLookUp: false,
  limit: {
    mainCategory: 0,
    subCategory: 0,
    pages: 0,
  },
};
const main = async () => {
  let targetShops = targetRetailerList;
  const startShops = undefined;

  if (startShops && startShops.length) {
    targetShops = [...targetShops, ...startShops];
  }

  const shops = await getShops(targetShops);
  const {
    name,
    description,
    category: ctgry,
    nameSub,
    price: prc,
    promoPrice: prmPrc,
    image: img,
    link: lnk,
    shop: s,
  } = rawProd;

  const { mnfctr, prodNm } = getManufacturer(name);
  const dscrptnSegments = segmentString(description);
  const nmSubSegments = segmentString(nameSub);

  let procProd = {
    ctgry,
    mnfctr,
    nm: prodNm,
    img: prefixLink(img, s),
    lnk: prefixLink(lnk, s),
    prc: prmPrc ? safeParsePrice(prmPrc) : safeParsePrice(prc),
  };

  const reducedName = mnfctr + " " + reduceString(prodNm, 55);

  const query = {
    product: {
      key: reducedName,
      value: reducedName,
    },
    category: "default",
  };
  const prodInfo = {
    procProd,
    rawProd,
    dscrptnSegments,
    nmSubSegments,
  };

  const queue = new QueryQueue(
    task?.concurrency ? task.concurrency : CONCURRENCY,
    proxyAuth,
    task
  );
  await queue.connect();

  const procProductsPromiseArr = [];

  const _shops = await queryTargetShops(
    startShops ? startShops : targetShops,
    queue,
    shops,
    query,
    task,
    prodInfo
  );

  procProductsPromiseArr.push(Promise.all(_shops));

  return await Promise.all(procProductsPromiseArr);
};

main().then(async (r) => {});
