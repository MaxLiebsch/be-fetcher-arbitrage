import { sub } from "date-fns";

const testParameters = {
  "amazon.de": {
    productPageUrl: "https://www.amazon.de/dp/product/B0CZF84L12?language=de_DE"
  },
  "ebay.de": {
    productPageUrl: "https://www.ebay.de/p/180305085542"
    
  },
  "bergfreunde.de": {
    productPageUrl: "https://www.bergfreunde.de/stoic-womens-performance-merino150-bydalenst-shirt-merinoshirt",
  },
  "mueller.de": {
    productPageUrl:
      "https://www.mueller.de/p/annemarie-boerlind-liquid-eyeliner-2849185/",
  },
  "reichelt.de": {
    productPageUrl:
      "https://www.reichelt.de/netzwerktester-mit-digital-multimeter-peaktech-3365-p81095.html?&trstct=pol_11&nbc=1",
  },
  "voelkner.de": {
    productPageUrl:
      "https://www.voelkner.de/products/3033086/Maul-MAULjoy-touch-of-rose-8200623-LED-Tischlampe-7W-EEK-D-A-G-Touch-of-Rose.html?offer=2cd3f55cee8dd6c0af91e54672f0143b",
  },
  "alternate.de": {
    productPageUrl:
      "https://www.alternate.de/Ubiquiti/UniFi-Switch-Pro-Max-48/html/product/100047357",
  },
  "cyberport.de": {
    productsPerPage: 15,
    subCategoriesCount: 27,
    mainCategoriesCount: 8,
    initialProductPageUrl:
      "https://www.cyberport.de/notebook-und-tablet/tablets.html",
    nextPageUrl:
      "https://www.cyberport.de/notebook-und-tablet/tablets.html?p=2",
  },
  "weltbild.de": {
    productsPerPage: 30,
    subCategoriesCount: 42,
    mainCategoriesCount: 18,
    initialProductPageUrl: "https://www.weltbild.de/buecher/dystopie",
    subCategoryUrl: "https://www.weltbild.de/buecher/dystopie",
    nextPageUrl: "https://www.weltbild.de/buecher/dystopie?seite=2",
  },
  "dm.de": {
    productPageUrl: "https://www.dm.de/dmbio-kichererbsen-p4066447443073.html",
    productsPerPage: 30,
    productsPerPageAfterLoadMore: 150,
    subCategoriesCount: 3,
    mainCategoriesCount: 12,
    initialProductPageUrl: "https://www.dm.de/ernaehrung/kaffee-tee-kakao",
    nextPageUrl: "https://www.dm.de/ernaehrung/kaffee-tee-kakao?currentPage0=2",
  },
  "fressnapf.de": {
    countProductPageUrl: "https://www.fressnapf.de/c/katze/katzenfutter/nassfutter/",
    pages: 20,
    productPageUrl:
      "https://www.fressnapf.de/p/orijen-original-cat-340-g-1261000/",
    productsPerPage: 48,
    productsPerPageAfterLoadMore: 7,
    subCategoriesCount: 6,
    mainCategoriesCount: 9,
    initialProductPageUrl:
      "https://www.fressnapf.de/c/kleintier/kleintierheim/streu-stroh/",
    subCategoryUrl: "https://www.fressnapf.de/c/kleintier/",
    nextPageUrl:
      "https://www.fressnapf.de/c/kleintier/kleintierheim/streu-stroh/?currentPage=2",
  },
  "saturn.de": {
    productPageUrl:
      "https://www.saturn.de/de/product/_philips-hr-1949-20-avance-2208438.html",
    productsPerPage: 12,
    productsPerPageAfterLoadMore: 12,
    subCategoriesCount: 30,
    mainCategoriesCount: 9,
    initialProductPageUrl:
      "https://www.saturn.de/de/category/k%C3%BChl-gefrierkombinationen-1651.html",
    subCategoryUrl:
      "https://www.saturn.de/de/category/haushalt-k%C3%BCche-bad-1197.html",
    nextPageUrl:
      "https://www.saturn.de/de/category/k%C3%BChl-gefrierkombinationen-1651.html?page=2",
  },
  "alza.de": {
    productPageUrl:
      "https://www.alza.de/soundmaster-pdb1600sw-d6361089.htm",
    productsPerPage: 24,
    productsPerPageAfterLoadMore: 12,
    subCategoriesCount: 48,
    mainCategoriesCount: 14,
    initialProductPageUrl: "https://www.alza.de/fernseher/18849604.htm",
    subCategoryUrl: "https://www.alza.de/fernseher/18849604.htm",
    nextPageUrl:
      "https://www.alza.de/fernseher/18849604.htm#f&cst=null&cud=0&pg=2",
  },
  "gamestop.de": {
    productPageUrl:
      "https://www.gamestop.de/Accessories/Games/63594/pulse-3d-wireless-headset-midnight-black",
    productsPerPage: 48,
    productsPerPageAfterLoadMore: 48,
    subCategoriesCount: 6,
    mainCategoriesCount: 9,
    initialProductPageUrl:
      "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&shippingMethod=2",
    subCategoryUrl: "https://www.gamestop.de/XboxOne/Index",
    nextPageUrl:
      "https://www.gamestop.de/SearchResult/QuickSearch?platform=90?currentPage0=2",
  },
  "idealo.de": {
    productPageUrl:
      "https://www.idealo.de/preisvergleich/OffersOfProduct/202961754_-sport-bag-2023-satch.html",
    productsPerPage: 48,
    productsPerPageAfterLoadMore: 7,
    subCategoriesCount: 6,
    mainCategoriesCount: 9,
    initialProductPageUrl:
      "https://www.idealo.de/preisvergleich/ProductCategory/10832.html",
    subCategoryUrl:
      "https://www.idealo.de/preisvergleich/SubProductCategory/3932.html",
    nextPageUrl:
      "https://www.idealo.de/preisvergleich/ProductCategory/10832I16-15.html",
  },
};

export default testParameters;
