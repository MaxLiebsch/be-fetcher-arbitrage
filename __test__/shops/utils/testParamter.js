import { sub } from "date-fns";

const testParameters = {
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
    productsPerPage: 30,
    productsPerPageAfterLoadMore: 150,
    subCategoriesCount: 3,
    mainCategoriesCount: 12,
    initialProductPageUrl: "https://www.dm.de/ernaehrung/kaffee-tee-kakao",
    nextPageUrl: "https://www.dm.de/ernaehrung/kaffee-tee-kakao?currentPage0=2",
  },
  "fressnapf.de": {
    productsPerPage: 48,
    productsPerPageAfterLoadMore: 7,
    subCategoriesCount: 6,
    mainCategoriesCount: 9,
    initialProductPageUrl: "https://www.fressnapf.de/c/kleintier/kleintierheim/streu-stroh/",
    subCategoryUrl: "https://www.fressnapf.de/c/kleintier/",
    nextPageUrl: "https://www.fressnapf.de/c/kleintier/kleintierheim/streu-stroh/?currentPage=2",
  },
  "saturn.de": {
    productsPerPage: 12,
    productsPerPageAfterLoadMore: 12,
    subCategoriesCount: 30,
    mainCategoriesCount: 9,
    initialProductPageUrl: "https://www.saturn.de/de/category/k%C3%BChl-gefrierkombinationen-1651.html",
    subCategoryUrl: "https://www.saturn.de/de/category/haushalt-k%C3%BCche-bad-1197.html",
    nextPageUrl: "https://www.saturn.de/de/category/k%C3%BChl-gefrierkombinationen-1651.html?page=2",
  },
  "alza.de": {
    productsPerPage: 24,
    productsPerPageAfterLoadMore: 12,
    subCategoriesCount: 48,
    mainCategoriesCount: 14,
    initialProductPageUrl: "https://www.alza.de/fernseher/18849604.htm",
    subCategoryUrl: "https://www.alza.de/fernseher/18849604.htm",
    nextPageUrl: "https://www.alza.de/fernseher/18849604.htm#f&cst=null&cud=0&pg=2",
  },
  "gamestop.de": {
    productsPerPage: 48,
    productsPerPageAfterLoadMore: 48,
    subCategoriesCount: 6,
    mainCategoriesCount: 9,
    initialProductPageUrl: "https://www.gamestop.de/SearchResult/QuickSearch?platform=90",
    subCategoryUrl: "https://www.gamestop.de/XboxOne/Index",
    nextPageUrl: "https://www.gamestop.de/SearchResult/QuickSearch?platform=90?currentPage0=2",
  },
};

export default testParameters;
