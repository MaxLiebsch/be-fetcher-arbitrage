import { createOrUpdateArbispotterProduct } from "../../src/services/db/util/createOrUpdateArbispotterProduct.js";
import { createOrUpdateCrawlDataProduct } from "../../src/services/db/util/createOrUpdateCrawlDataProduct.js";
import { findCrawledProductByLink } from "../../src/services/db/util/crudCrawlDataProduct.js";

const main = async () => {
  return await createOrUpdateCrawlDataProduct(
    "alternate.de",
    {
      link: "https://www.alternat.de/Rzer/USB-C-130W-GaN-Charger-Ladeger%C3%A4t/html/product/1773883",
      category: ["Smartphone", "Smartphone Zubehör"],
      createdAt: "2024-06-21T00:19:53.029Z",
      description:
        "Gleichzeitig ladbar: 4 Geräte Anschlüsse: 2x USB-C, 2x USB-A Stromquelle: Steckdose",
      hasMnfctr: false,
      image:
        "https://www.alternate.de/p/200x200/3/8/Razer_USB_C_130W_GaN_Charger__Ladeger_t@@1773883.jpg",
      instock: "Auf Lager",
      locked: false,
      matched: false,
      mnfctr: "",
      name: "Razer USB-C 130W GaN Charger, Ladegerät",
      nameSub: "schwarz",
      price: 159.9,
      prime: false,
      promoPrice: 0,
      s_hash: "f34f6db1d2829bda4bb6b1d38fbfbc93",
      shop: "alternate.de",
      updatedAt: "2024-06-26T13:58:46.121Z",
      vendor: "",
      ean_locked: false,
      ean_taskId: "",
      ean: "8886419337249",
      ean_prop: "found",
      matchedAt: "2024-06-11T20:43:21.002Z",
      sku: 1773883,
      taskId: "",
      info_locked: true,
      info_taskId: "clr6:667b18d3c5842ca64e3c1912",
    }
  );
  // return await createOrUpdateArbispotterProduct(
  //   "alternate.de",
  //   {
  //     s: "alternate.de",
  //     ean: "",
  //     pblsh: false,
  //     ctgry: ["Hardware", "Netzwerktechnik"],
  //     mnfctr: "Ubiquiti",
  //     nm: "USW-16-POE, Switch",
  //     e_prc: 279.9,
  //     a_prc: 1,
  //     img: "https://www.alternate.de/p/200x200/l/Ubiquiti_USW_16_POE__Switch@@lgsq38.jpg",
  //     lnk: "https://www.alternate.de/Ubiquiti/USW-16-POE-Switch/html/product/1617281",
  //     prc: 299,
  //     createdAt: "2024-04-24T10:41:39.069Z",
  //     updatedAt: "2024-06-27T06:41:51.741Z",
  //     a_lnk: "https://www.amazon.de/dp/product/B08385FZHS",
  //     a_img:
  //       "https://www.alternate.de/p/200x200/l/Ubiquiti_USW_16_POE__Switch@@lgsq38.jpg",
  //     a_nm: "Ubiquiti Networks US-16-150W 2-Layer-Switch mit (16) Gigabit-Ethernet-Ports und (2) Gigabit-SFP-Ports",
  //     a_mrgn: -258.13,
  //     a_mrgn_pct: -30729.8,
  //     e_lnk:
  //       "https://www.ebay.de/itm/156262303126?var=0&mkevt=1&mkcid=1&mkrid=707-53477-19255-0&toolid=20006&campid=5337770552&customid=uXUrQSn1_-IV0_Vl-Xvnow",
  //     e_img:
  //       "https://www.alternate.de/p/200x200/l/Ubiquiti_USW_16_POE__Switch@@lgsq38.jpg",
  //     e_nm: "Ubiquiti USW-16-PoE UniFi Switch grau 2x SFP Neu",
  //     e_mrgn: -19.1,
  //     e_mrgn_pct: -6.4,
  //     lckd: false,
  //     taskId: "",
  //     asin: "B08385FZHS",
  //     bsr: [
  //       {
  //         createdAt: "2024-06-27T06:41:51.729Z",
  //         category: "Computer & Zubehör",
  //         number: 60,
  //       },
  //     ],
  //     a_hash: "5038d9565afea96f54a3246fbe5c9e06",
  //     a_vrfd: {
  //       vrfd: false,
  //       vrfn_pending: true,
  //       flags: [],
  //       flag_cnt: 0,
  //     },
  //     e_hash: "3f9909a7e0cea7f817c2cf2494c31919",
  //     e_vrfd: {
  //       vrfd: false,
  //       vrfn_pending: true,
  //       flags: [],
  //       flag_cnt: 0,
  //     },
  //     a_orgn: "a",
  //     e_orgn: "i",
  //     keepa_lckd: false,
  //     ahstprcs: null,
  //     anhstprcs: null,
  //     auhstprcs: null,
  //     availabilityAmazon: null,
  //     avg90_ahsprcs: null,
  //     avg90_ansprcs: null,
  //     avg90_ausprcs: null,
  //     avg90_salesRank: null,
  //     brand: null,
  //     buyBoxIsAmazon: null,
  //     categories: null,
  //     categoryTree: null,
  //     curr_ahsprcs: null,
  //     curr_ansprcs: null,
  //     curr_ausprcs: null,
  //     curr_salesRank: null,
  //     eanList: ["0817882028547"],
  //     keepaUpdatedAt: "2024-06-12T13:04:55.181Z",
  //     monthlySold: null,
  //     numberOfItems: null,
  //     salesRanks: null,
  //     stockAmount: null,
  //     stockBuyBox: null,
  //     totalOfferCount: 45,
  //     k_eanList: null,
  //     aznUpdatedAt: "2024-06-27T06:41:51.737Z",
  //     a_p_mrgn: -258.38,
  //     a_p_mrgn_pct: -30759.5,
  //     a_p_w_mrgn: -258.53,
  //     a_p_w_mrgn_pct: -30777.4,
  //     a_w_mrgn: -258.28,
  //     a_w_mrgn_pct: -30747.6,
  //     costs: {
  //       azn: 0.3,
  //       varc: 0,
  //       strg_1_hy: 0.4,
  //       strg_2_hy: 0.55,
  //       tpt: 7.01,
  //     },
  //     tax: 19,
  //     a_pblsh: true,
  //     e_pblsh: true,
  //   }
  // );
};

main().then((r) => {
  console.log("r:", r);
  process.exit(0);
});
