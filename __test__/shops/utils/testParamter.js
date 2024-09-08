import { sub } from "date-fns";

const testParameters = {
  "amazon.de": {
    productPageUrl: "https://www.amazon.de/dp/product/B0BZ9NMMW4?language=de_DE"
  },
  "ebay.de": {
    productPageUrl: "https://www.ebay.de/itm/256420198915",
  },
  "bergfreunde.de": {
    productPageUrl:
      "https://www.bergfreunde.de/hunter-collar-convenience-hundehalsband/?cnid=7213b99a7a48b405e9410053d1d0f8b3",
  },
  "mueller.de": {
    productPageUrl:
      "https://www.mueller.de/p/mjamjam-katzennassfutter-quetschie-insekt-mit-saftigem-huehnchen-IPN2912009/",
  },
  "reichelt.de": {
    productPageUrl:
      "https://www.reichelt.de/kfz-lufterfrischer-wunderbaum-kirsche-kfz-153206-p337369.html",
  },
  "voelkner.de": {
    productPageUrl:
      "https://www.voelkner.de/products/1320099/Digitus-2-Port-Serielle-Steckkarte-Seriell-9pol.-PCI.html?offer=92b13922a56b1ef0318dab1bad8b94b8",
  },
  "alternate.de": {
    productPageUrl:
      "https://www.alternate.de/Duracell/AAAA-Ultra-M3-MN-2500-1-5V-Batterie/html/product/1219348",
  },
  "cyberport.de": {
    productsPerPage: 15,
    subCategoriesCount: 27,
    mainCategoriesCount: 8,
    productPageUrl:
      "https://www.cyberport.de/pc-und-zubehoer/drucker-scanner/druckerzubehoer/oki/pdp/6k07-170/oki-46539501-ic-halter-fuer-kartenleser.html",
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
    productPageUrl: "https://www.dm.de/nutrisse-haarfarbe-6n-nude-natuerliches-dunkelblond-p3600541901643.html",
    productsPerPage: 30,
    productsPerPageAfterLoadMore: 150,
    subCategoriesCount: 3,
    mainCategoriesCount: 12,
    initialProductPageUrl: "https://www.dm.de/ernaehrung/kaffee-tee-kakao",
    nextPageUrl: "https://www.dm.de/ernaehrung/kaffee-tee-kakao?currentPage0=2",
  },
  "fressnapf.de": {
    countProductPageUrl:
      "https://www.fressnapf.de/c/katze/katzenfutter/nassfutter/",
    pages: 20,
    productPageUrl:
      "https://www.fressnapf.de/p/tetra-reptomin-energy-250ml-1035195/",
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
      "https://www.saturn.de/de/product/_apple-iphone-xs-64gb-silver-64-gb-silber-dual-sim-142207689.html",
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
      "https://www.alza.de/27-eizo-color-edge-cg2700s-d7504011.htm",
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
      "https://www.gamestop.de/PS4/Games/63744/kontrolfreek-galaxy",
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
      "https://www.idealo.de/preisvergleich/OffersOfProduct/202152796_-echo-dot-5-generation-weiss-amazon.html",
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
