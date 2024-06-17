import { getProductInfoWithFetch, ShopObject } from "@dipmaxtech/clr-pkg";
import {
  getAllShops,
  //@ts-ignore
} from "../../src/services/db/util/shops.js";
//@ts-ignore
import { proxyAuth } from "../../src/constants.js";

describe("fetch", () => {
  let shops: ShopObject[] = [];
  beforeAll(async () => {
    shops = await getAllShops();
  });
  it("fetch: alternate", async () => {
    const shop = shops.find((shop) => shop.d === "alternate.de");
    if (shop) {
      const res = await getProductInfoWithFetch(
        "https://www.alternate.de/Ubiquiti/USW-16-POE-Switch/html/product/1617281",
        shop,
        proxyAuth
      );
      console.log(
        `${shop.d} - res.productInfo:`,
        res.productInfo?.ean,
        "status:",
        res.status
      );
      if (res.productInfo) {
        expect(res.productInfo.ean).toBe("0817882028547");
        expect(res.productInfo.sku).toBe(1617281);
      } else {
        expect(1).toBe(2);
      }
    }
  }, 60000);
  it("fetch: reichelt", async () => {
    const shop = shops.find((shop) => shop.d === "reichelt.de");
    if (shop) {
      const res = await getProductInfoWithFetch(
        "https://www.reichelt.de/netzwerktester-mit-digital-multimeter-peaktech-3365-p81095.html?&trstct=pol_11&nbc=1",
        shop,
        proxyAuth
      );
      console.log(
        `${shop.d} - res.productInfo:`,
        res.productInfo?.ean,
        "status:",
        res.status
      );
      if (res.productInfo) {
        expect(res.productInfo.ean).toBe("4250569400872");
      } else {
        expect(1).toBe(2);
      }
    }
  }, 60000);
  it("fetch: voelkner", async () => {
    const shop = shops.find((shop) => shop.d === "voelkner.de");
    if (shop) {
      const res = await getProductInfoWithFetch(
        "https://www.voelkner.de/products/3033086/Maul-MAULjoy-touch-of-rose-8200623-LED-Tischlampe-7W-EEK-D-A-G-Touch-of-Rose.html?offer=2cd3f55cee8dd6c0af91e54672f0143b",
        shop,
        proxyAuth
      );
      console.log(
        `${shop.d} - res.productInfo:`,
        res.productInfo?.ean,
        "status:",
        res.status
      );
      if (res.productInfo) {
        expect(res.productInfo.ean).toBe("4002390080644");
        expect(res.productInfo.sku).toBe("A474832");
      } else {
        expect(1).toBe(2);
      }
    }
  }, 60000);
  it("fetch: dm", async () => {
    const shop = shops.find((shop) => shop.d === "dm.de");
    if (shop) {
      const res = await getProductInfoWithFetch(
        "https://www.dm.de/dmbio-kichererbsen-p4066447443073.html",
        shop,
        proxyAuth
      );
      console.log(
        `${shop.d} - res.productInfo:`,
        res.productInfo?.ean,
        "status:",
        res.status
      );
      if (res.productInfo) {
        expect(res.productInfo.ean).toBe("4066447443073");
        expect(res.productInfo.sku).toBe("1686838");
      } else {
        expect(1).toBe(2);
      }
    }
  }, 60000);
  it("fetch: mueller", async () => {
    const shop = shops.find((shop) => shop.d === "mueller.de");
    if (shop) {
      const res = await getProductInfoWithFetch(
        "https://www.mueller.de/p/mueller-toy-place-lern-und-sortierhaus-IPN2919475/",
        shop,
        proxyAuth
      );
      console.log(
        `${shop.d} - res.productInfo:`,
        res.productInfo?.ean,
        "status:",
        res.status
      );
      if (res.productInfo) {
        expect(res.productInfo.ean).toBe("2200291947598");
        expect(res.productInfo.sku).toBe("IPN2919475");
      } else {
        expect(1).toBe(2);
      }
    }
  }, 60000);
  it("fetch: saturn", async () => {
    const shop = shops.find((shop) => shop.d === "saturn.de");
    if (shop) {
      const res = await getProductInfoWithFetch(
        "https://www.saturn.de/de/product/_philips-hr-1949-20-avance-2208438.html",
        shop,
        proxyAuth
      );
      console.log(
        `${shop.d} - res.productInfo:`,
        res.productInfo?.ean,
        "status:",
        res.status
      );
      if (res.productInfo) {
        expect(res.productInfo.ean).toBe("8710103800576");
        expect(res.productInfo.sku).toBe("107462622");
      } else {
        expect(1).toBe(2);
      }
    }
  }, 60000);
  it("fetch: fressnapf", async () => {
    const shop = shops.find((shop) => shop.d === "fressnapf.de");
    if (shop) {
      const res = await getProductInfoWithFetch(
        "https://www.fressnapf.de/p/quiko-hand-formula-3-kg-handaufzucht-fuer-papageien-und-sittiche---handfuetterung-von-jungvoegeln-1387817/",
        shop,
        proxyAuth
      );
      console.log(
        `${shop.d} - res.productInfo:`,
        res.productInfo?.ean,
        "status:",
        res.status
      );
      if (res.productInfo) {
        expect(res.productInfo.ean).toBe("4019181201324");
        expect(res.productInfo.sku).toBe("1387817");
      } else {
        expect(1).toBe(2);
      }
    }
  }, 60000);
  it("fetch: gamestop", async () => {
    const shop = shops.find((shop) => shop.d === "gamestop.de");
    if (shop) {
      const res = await getProductInfoWithFetch(
        "https://www.gamestop.de/Accessories/Games/63594/pulse-3d-wireless-headset-midnight-black",
        shop,
        proxyAuth
      );
      console.log(
        `${shop.d} - res.productInfo:`,
        res.productInfo?.ean,
        "status:",
        res.status
      );
      if (res.productInfo) {
        expect(res.productInfo.ean).toBe("0711719833994");
        expect(res.productInfo.sku).toBe("296577");
      } else {
        expect(1).toBe(2);
      }
    }
  }, 60000);
  it("fetch: kaufland", async () => {
    const shop = shops.find((shop) => shop.d === "kaufland.de");
    if (shop) {
      const res = await getProductInfoWithFetch(
        "https://www.kaufland.de/product/479798975/",
        shop,
        proxyAuth
      );
      console.log(
        `${shop.d} - res.productInfo:`,
        res.productInfo?.ean,
        "status:",
        res.status
      );
      if (res.productInfo) {
        expect(res.productInfo.ean).toBe("8806094881387");
      } else {
        expect(1).toBe(2);
      }
    }
  }, 60000);
  it("fetch: alza", async () => {
    const shop = shops.find((shop) => shop.d === "alza.de");
    if (shop) {
      const res = await getProductInfoWithFetch(
        "https://www.alza.de/epson-workforce-pro-wf-3820dwf-d6204051.htm",
        shop,
        proxyAuth
      );
      console.log(
        `${shop.d} - res.productInfo:`,
        res.productInfo?.ean,
        "status:",
        res.status
      );
      if (res.productInfo) {
        expect(res.productInfo.ean).toBe("8715946679785");
        expect(res.productInfo.sku).toBe("PE020u4a3");
        expect(res.productInfo.mku).toBe("C11CJ07403");
      } else {
        expect(1).toBe(2);
      }
    }
  }, 60000);
  it("fetch: idealo", async () => {
    const shop = shops.find((shop) => shop.d === "idealo.de");
    if (shop) {
      const res = await getProductInfoWithFetch(
        "https://www.idealo.de/preisvergleich/OffersOfProduct/4563915_-bio-folgemilch-auf-ziegenmilchbasis-2-400g-holle.html#datasheet",
        shop,
        proxyAuth
      );
      console.log(
        `${shop.d} - res.productInfo:`,
        res.productInfo?.ean,
        "status:",
        res.status
      );
      if (res.productInfo) {
        expect(res.productInfo.ean).toBe("4150105524850");
        expect(res.productInfo.sku).toBe("4150105524850");
      } else {
        expect(1).toBe(2);
      }
    }
  }, 120000);
  it("fetch: bergfreunde", async () => {
    const shop = shops.find((shop) => shop.d === "bergfreunde.de");
    if (shop) {
      const res = await getProductInfoWithFetch(
        "https://www.bergfreunde.de/stoic-womens-performance-merino150-bydalenst-shirt-merinoshirt",
        shop,
        proxyAuth
      );
      console.log(
        `${shop.d} - res.productInfo:`,
        res.productInfo?.ean,
        "status:",
        res.status
      );
      if (res.productInfo) {
        expect(res.productInfo.ean).toBe("4008097501413");
      } else {
        expect(1).toBe(2);
      }
    }
  }, 120000);
});
