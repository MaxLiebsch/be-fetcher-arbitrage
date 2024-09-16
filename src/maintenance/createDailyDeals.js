import { addTask } from "../db/util/tasks.js";
import { createDailySalesTask } from "../task.js";

const categories = {
  "idealo.de": {
    proxyType: "mix",
    productLimit: 4000,
    categories: [
      {
        name: "Sale",
        link: "https://www.idealo.de/preisvergleich/MainSearchProductCategory/100oE0oJ4.html",
        limit: {
          subCategories: 100,
          pages: 10,
        },
        productLimit: 20,
      },
    ],
  },
  "mueller.de": {
    //crawl_shop_mueller.de_4_of_4
    proxyType: "mix",
    productLimit: 2000,
    categories: [
      {
        name: "Sale",
        link: "https://www.mueller.de/sale/",
        limit: {
          subCategories: 100,
          pages: 10,
        },
      },
    ],
  },
  "reichelt.de": {
    //crawl_shop_reichelt.de_6_of_6
    proxyType: "mix",
    productLimit: 2000,
    categories: [
      {
        name: "Neu",
        link: "https://www.reichelt.de/?PAGE=2",
        limit: {
          subCategories: 100,
          pages: 10,
        },
        productLimit: 20,
      },
      {
        name: "Sale",
        link: "https://www.reichelt.de/sale-l2568.html",
        limit: {
          subCategories: 100,
          pages: 10,
        },
        productLimit: 20,
      },
    ],
  },
  "voelkner.de": {
    proxyType: "mix",
    productLimit: 2000,
    categories: [
      {
        name: "Sale",
        link: "https://www.voelkner.de/categories/13150_13268/Freizeit-Hobby/Sale.html",
        limit: {
          subCategories: 100,
          pages: 10,
        },
        productLimit: 20,
      },
      {
        name: "Sale",
        link: "https://www.voelkner.de/products/dailydeals.html?itm_source=info&itm_medium=deals_block&itm_campaign=goToDealsPage",
        limit: {
          subCategories: 100,
          pages: 10,
        },
        productLimit: 20,
      },
    ],
  },
  "dm.de": {
    proxyType: "mix",
    productLimit: 2000,
    categories: [
      {
        name: "Neu",
        link: "https://www.dm.de/neu", //crawl_shop_dm.de_1_of_6
        limit: {
          subCategories: 100,
          pages: 10,
        },
        productLimit: 20,
      },
      {
        name: "Sale",
        link: "https://www.dm.de/ausverkauf", //crawl_shop_dm.de_6_of_6
        limit: {
          subCategories: 100,
          pages: 10,
        },
        productLimit: 20,
      },
    ],
  },
  "fressnapf.de": {
    proxyType: "mix",
    productLimit: 2000,
    categories: [
      {
        name: "Sale",
        link: "https://www.fressnapf.de/aktionen-angebote/sale/", //crawl_shop_fressnapf.de_1_of_6
        limit: {
          subCategories: 100,
          pages: 10,
        },
        productLimit: 20,
      },
      {
        name: "Sale",
        link: "https://www.fressnapf.de/aktionen-angebote/preiskraller/", //crawl_shop_fressnapf.de_1_of_6
        limit: {
          subCategories: 100,
          pages: 10,
        },
        productLimit: 20,
      },
    ],
  },
  "saturn.de": {
    proxyType: "mix",
    productLimit: 4000,
    categories: [
      {
        name: "Sale",
        link: "https://www.saturn.de/de/campaign/angebote-aktionen", //crawl_shop_saturn.de_1_of_9
        limit: {
          subCategories: 100,
          pages: 10,
        },
        productLimit: 20,
      },
      {
        name: "Restposten",
        link: "https://www.saturn.de/de/campaign/restposten", //crawl_shop_saturn.de_1_of_9
        limit: {
          subCategories: 100,
          pages: 10,
        },
        productLimit: 20,
      },
    ],
  },
  "alza.de": {
    proxyType: "mix",
    productLimit: 2000,
    categories: [
      {
        name: "Sale",
        link: "https://www.alza.de/rabatte/y842.htm",
        limit: {
          subCategories: 100,
          pages: 10,
        },
        productLimit: 20,
      },
    ],
  },
  "gamestop.de": {
    proxyType: "mix",
    productLimit: 2000,
    categories: [
      {
        name: "Sale", // crawl_shop_gamestop.de_2_of_7
        link: "https://www.gamestop.de/SearchResult/QuickSearch?variantType=1&strokenPrice=Jetzt%20g%C3%BCnstiger",
        limit: {
          subCategories: 100,
          pages: 10,
        },
        productLimit: 20,
      },
    ],
  },
  "alternate.de": {
    proxyType: "mix",
    productLimit: 2000,
    categories: [
      {
        name: "Sale",
        link: "https://www.alternate.de/Aktionen", // crawl_shop_alternate.de_1_of_11
        limit: {
          subCategories: 100,
          pages: 10,
        },
        productLimit: 20,
      },
      {
        name: "Sale",
        link: "https://www.alternate.de/TagesDeals", // crawl_shop_alternate.de_2_of_11
        limit: {
          subCategories: 100,
          pages: 10,
        },
        productLimit: 20,
      },
      {
        name: "Outlet",
        link: "https://www.alternate.de/Outlet", // crawl_shop_alternate.de_11_of_11
        limit: {
          subCategories: 100,
          pages: 10,
        },
        productLimit: 20,
      },
    ],
  },
};

const createDailyDeals = async (shopsWithCategories) => {
  return await Promise.all(
    Object.entries(shopsWithCategories).map(
      async ([shopDomain, shopCategories]) => {
        const task = createDailySalesTask(
          shopDomain,
          shopCategories.categories,
          shopCategories.productLimit,
          shopCategories.proxyType
        );
        return addTask(task, true);
      }
    )
  );
};

createDailyDeals(categories).then((r) => console.log(r));
