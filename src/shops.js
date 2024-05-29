import { interval } from "date-fns";
import { insertShop } from "./services/db/util/shops.js";

export const shops = {
  "idealo.de": {
    exceptions: ["https://www.idealo.de/offerpage/offerlist/product/"],
    manualCategories: [
      {
        name: "Sale",
        link: "https://www.idealo.de/preisvergleich/MainSearchProductCategory/100oE0oJ4.html",
      },
    ],
    resourceTypes: {
      crawl: [
        "media",
        "font",
        "stylesheet",
        "ping",
        "image",
        "xhr",
        "fetch",
        "imageset",
        "sub_frame",
        "script",
        "other",
      ],
      query: [
        "media",
        "font",
        "stylesheet",
        "ping",
        "image",
        "xhr",
        // "fetch",
        "imageset",
        "sub_frame",
        // "script",
        "other",
      ],
    },
    pauseOnProductPage: {
      pause: true,
      min: 500,
      max: 800,
    },
    waitUntil: { product: "domcontentloaded", entryPoint: "domcontentloaded" },
    queryUrlSchema: [
      {
        baseUrl: `https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=<query>`,
        category: "default",
      },
    ],
    d: "idealo.de",
    mimic: "svg.i-header-logo-image",
    purlschema: "Prod\\w*\\/\\d*",
    rules: [
      {
        description:
          "Block all .js files except those containing 'vendor' or 'idealo-'",
        action: "abort",
        conditions: [
          {
            type: "endsWith",
            value: ".js",
          },
          {
            type: "notIncludes",
            value: "vendor",
          },
          {
            type: "notIncludes",
            value: "idealo-",
          },
        ],
      },
      {
        description: "Block URLs matching a specific UUID pattern",
        action: "abort",
        conditions: [
          {
            type: "regexMatch",
            value:
              "[0-9a-fA-F]{8}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{12}",
          },
        ],
      },
    ],
    actions: [
      {
        type: "recursive-button",
        sel: "button.productOffers-listLoadMore",
        action: "click",
        waitDuration: 600,
        wait: false,
      },
    ],
    entryPoints: [
      {
        url: "https://www.idealo.de",
        category: "default",
      },
    ],
    crawlActions: [],
    queryActions: [
      // {
      //   type: "button",
      //   sel: "div.sr-resultItemTile",
      //   action: "click",
      //   wait: true,
      // },
      // {
      //   type: "button",
      //   sel: "button.productOffers-listLoadMore",
      //   action: "click",
      //   wait: true,
      // },
      // {
      //   type: "button",
      //   sel: "button.productOffers-listLoadMore",
      //   action: "click",
      //   wait: false,
      // },
    ],
    categories: {
      exclude: ["flug", "flüge", "hotel"],
      sel: "div.TopCategoriesCarouselstyle__TopCategoriesTextCarousel-sc-5vawzj-1 a",
      type: "href",
      basepath: true,
      subCategories: [
        {
          sel: "div.cn-categoryGrid div.cn-categoryGridItem a:has(div.cn-categoryGridItem__title)",
          type: "href",
        },
      ],
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div[class*=sr-pagination__numbers]",
        nav: "I16-<page>.html",
        scrollToBottom: true,
        paginationUrlSchema: {
          replace: "\\.html",
          withQuery: false,
          calculation: {
            method: "offset",
            offset: 15,
          },
        },
        calculation: {
          method: "count",
          last: "div[class*=sr-pagination__numbers] a[class*=sr-pageElement]",
          sel: "div[class*=sr-pagination__numbers] a[class*=sr-pageElement]",
        },
      },
      {
        type: "pagination",
        sel: "ul.pagination",
        scrollToBottom: true,
        nav: "/100I16-<page>.html?q=<query>",
        paginationUrlSchema: {
          replace: "\\.html\\?q=\\S*",
          withQuery: true,
          calculation: {
            method: "offset",
            offset: 15,
          },
        },
        calculation: {
          method: "count",
          last: "li.pagination-item a",
          sel: "li.pagination-item a",
        },
      },
    ],
    productList: [
      {
        sel: "div.offerList",
        timeout: 100,
        productCntSel: [
          "span[class*=offerList-count]",
          "span[class*=sr-resultTitle__resultCount]",
        ],
        product: {
          sel: "div.offerList a.offerList-itemWrapper",
          type: "link",
          details: [
            {
              content: "image",
              sel: "img",
              type: "src",
            },
            {
              content: "name",
              sel: "div.offerList-item-description-title",
              type: "text",
            },
            {
              content: "description",
              sel: "span.description-part-one",
              type: "text",
            },
            {
              content: "price",
              sel: "div.offerList-item-priceMin",
              type: "text",
            },
          ],
        },
      },
      {
        sel: "div[id=offerList]",
        timeout: 100,
        type: "shopcomparison",
        productCntSel: [
          "span[class*=offerList-count]",
          "span[class*=sr-resultTitle__resultCount]",
        ],
        product: {
          sel: "div[id=offerList] li.productOffers-listItem",
          type: "not_link",
          details: [
            {
              content: "link",
              sel: "a.productOffers-listItemTitle",
              type: "href",
            },
            {
              content: "vendor",
              sel: "img.productOffers-listItemOfferShopV2LogoImage",
              type: "alt",
            },
            {
              content: "name",
              sel: "span.productOffers-listItemTitleInner",
              type: "text",
            },
            {
              content: "price",
              sel: "a.productOffers-listItemOfferPrice",
              type: "text",
            },
          ],
        },
      },
      {
        sel: "div[class*=sr-resultList__]",
        timeout: 100,
        productCntSel: [
          "span[class*=offerList-count]",
          "span[class*=sr-resultTitle__resultCount]",
        ],
        product: {
          sel: "div[class*=sr-resultList_] div[class*=sr-resultList__item]",
          type: "not_link",
          details: [
            {
              content: "vendor",
              sel: "div[class*=sr-singleOffer__shopName] span[role=link]",
              type: "text",
            },
            {
              content: "link",
              sel: "div[class*=sr-resultItemLink] a",
              type: "href",
            },
            {
              content: "link",
              sel: 'span[role=button][data-wishlist-heart*="{"]',
              urls: {
                redirect:
                  "https://www.idealo.de/relocator/relocate?offerKey=<key>&type=oc_offer",
                default:
                  "https://www.idealo.de/preisvergleich/OffersOfProduct/",
              },
              attr: "data-wishlist-heart",
              key: "offerKey",
              redirect_regex: "^[0-9a-f]{32}$",
              type: "parse_json",
            },
            {
              content: "image",
              sel: "div[class*=sr-resultItemTile__imageSection] noscript",
              type: "text",
              extractPart: 0,
              regexp: "(www|http:|https:)+[^\\s]+[\\w]",
            },
            {
              content: "name",
              sel: "div[class*=sr-productSummary__title]",
              type: "text",
            },
            {
              content: "description",
              sel: "div[class*=sr-productSummary__description]",
              type: "text",
            },
            {
              content: "price",
              sel: "div[class*=sr-detailedPriceInfo__price]",
              type: "text",
            },
          ],
        },
      },
    ],
  },
  "alternate.de": {
    manualCategories: [
      {
        name: "Tages Deals",
        link: "https://www.alternate.de/TagesDeals",
      },
    ],
    waitUntil: { product: "load", entryPoint: "load" },
    entryPoint: "https://www.alternate.de",
    resourceTypes: {
      crawl: [
        "media",
        "font",
        "stylesheet",
        "ping",
        "image",
        "xhr",
        "fetch",
        "imageset",
        "sub_frame",
        "script",
        "other",
      ],
    },
    pauseOnProductPage: {
      pause: true,
      min: 500,
      max: 800,
    },
    d: "alternate.de",
    action: [],
    category: [],
    queryUrlSchema: [],
    mimic: "img.header-logo",
    queryActions: [],
    categories: {
      sel: "div[id=navigation-tree] a",
      type: "href",
      basepath: false,
      subCategories: [
        {
          sel: "div[id=category] div.accordion a.font-weight-bold",
          type: "href",
        },
      ],
    },
    entryPoints: [
      {
        url: "https://www.alternate.de",
        category: "default",
      },
    ],
    paginationEl: [
      {
        type: "pagination",
        sel: "div.d-flex.justify-content-center.align-items-baseline",
        nav: "?page=",
        calculation: {
          method: "count",
          sel: "div.d-flex.justify-content-center.align-items-baseline a",
        },
      },
    ],
    crawlActions: [],
    productList: [
      {
        sel: "div[id=dailyDeals]",
        type: "container",
        productCntSel: ["div.col-12.col-lg-6.my-2.my-lg-0 > div > div"],
        product: {
          sel: "a.card",
          type: "link",
          details: [
            {
              content: "image",
              sel: "img",
              type: "src",
            },
            {
              content: "name",
              sel: "div.product-name",
              type: "nested",
              remove: "span",
            },
            {
              content: "nameSub",
              sel: "span.product-name-sub",
              type: "text",
            },
            {
              content: "description",
              sel: "ul.product-info",
              type: "text",
            },
            {
              content: "price",
              sel: "span.price",
              type: "text",
            },
          ],
        },
      },
      {
        sel: "div.grid-container.listing-mosaic",
        type: "container",
        productCntSel: ["div.col-12.col-lg-6.my-2.my-lg-0 > div > div"],
        product: {
          sel: "a.card",
          type: "link",
          details: [
            {
              content: "image",
              sel: "div.card-header img",
              type: "src",
            },
            {
              content: "name",
              sel: "div.card-body div.product-name",
              type: "nested",
              remove: "span",
            },
            {
              content: "description",
              sel: "ul.product-info",
              type: "text",
            },
            {
              content: "price",
              sel: "div.card-footer span.price",
              type: "text",
            },
          ],
        },
      },
      {
        sel: "div.grid-container.listing",
        type: "container",
        productCntSel: ["div.col-12.col-lg-6.my-2.my-lg-0 > div > div"],
        product: {
          sel: "a.card",
          type: "link",
          details: [
            {
              content: "image",
              sel: "div.product-image img",
              type: "src",
            },
            {
              content: "nameSub",
              sel: "span.product-name-sub",
              type: "text",
            },
            {
              content: "instock",
              sel: "div.delivery-info",
              type: "text",
            },
            {
              content: "name",
              sel: "div.product-name",
              type: "nested",
              remove: "span",
            },
            {
              content: "description",
              sel: "ul.product-info",
              type: "text",
            },
            {
              content: "price",
              sel: "span.price",
              type: "text",
            },
          ],
        },
      },
      {
        sel: "div[id=highlights-inner-container]",
        type: "container",
        productCntSel: ["div.col-12.col-lg-6.my-2.my-lg-0 > div > div"],
        product: {
          sel: "a.card",
          type: "link",
          details: [
            {
              content: "image",
              sel: "img.ProductPicture",
              type: "src",
            },
            {
              content: "instock",
              sel: "div.delivery-info",
              type: "text",
            },
            {
              content: "manufacturer",
              sel: "div.manufacturer",
              type: "text",
            },
            {
              content: "name",
              sel: "div.product-name",
              type: "nested",
              remove: "span",
            },
            {
              content: "description",
              sel: "ul.product-info",
              type: "text",
            },
            {
              content: "price",
              sel: "div.price",
              type: "text",
            },
          ],
        },
      },
      {
        sel: "div[id=epoq-widget-entrypage]",
        type: "container",
        productCntSel: ["div.col-12.col-lg-6.my-2.my-lg-0 > div > div"],
        product: {
          sel: "a.card",
          type: "link",
          details: [
            {
              content: "image",
              sel: "img.ProductPicture",
              type: "src",
            },
            {
              content: "instock",
              sel: "div.delivery-info",
              type: "text",
            },
            {
              content: "manufacturer",
              sel: "div.manufacturer",
              type: "text",
            },
            {
              content: "name",
              sel: "div.product-name",
              type: "nested",
              remove: "span",
            },
            {
              content: "description",
              sel: "ul.product-info",
              type: "text",
            },
            {
              content: "price",
              sel: "div.price",
              type: "text",
            },
          ],
        },
      },
      {
        sel: "div:is(.product-carousel,[id=epoq-widget-categorypage])",
        type: "container",
        productCntSel: ["div.col-12.col-lg-6.my-2.my-lg-0 > div > div"],
        product: {
          sel: "a.card",
          type: "link",
          details: [
            {
              content: "image",
              sel: "img",
              type: "src",
            },
            {
              content: "name",
              sel: "div.product-name",
              type: "nested",
              remove: "span",
            },
            {
              content: "price",
              sel: "span.price",
              type: "text",
            },
            {
              content: "price",
              sel: "div.price",
              type: "text",
            },
          ],
        },
      },
    ],
  },
  "actionsports.de": {
    manualCategories: [],
    resourceTypes: {
      crawl: [
        "media",
        "font",
        "stylesheet",
        "ping",
        "image",
        "xhr",
        "fetch",
        "imageset",
        "sub_frame",
        "script",
        "other",
      ],
    },
    waitUntil: { product: "domcontentloaded", entryPoint: "domcontentloaded" },
    queryUrlSchema: [],
    d: "actionsports.de",
    mimic: "a.logo--link img",
    purlschema: "Prod\\w*\\/\\d*",
    action: [],
    entryPoints: [
      {
        url: "https://www.actionsports.de",
        category: "default",
      },
    ],
    crawlActions: [],
    queryActions: [
      {
        type: "shadowroot-button",
        sel: "aside[id=usercentrics-cmp-ui]",
        btn_sel: "button[id=deny]",
        action: "click",
        wait: false,
      },
      // {
      //   type: "input",
      //   sel: "input[id=i-search-input]",
      //   wait: false,
      //   what: ["product"],
      // },
      // {
      //   type: "button",
      //   sel: "button.i-search-button--submit",
      //   action: "click",
      //   wait: false,
      // },
    ],
    categories: {
      exclude: ["marken"],
      sel: "div.navigation--list-wrapper ul.navigation--list li.navigation--entry a",
      type: "href",
      subCategories: [
        {
          sel: "ul.is--level1 a.navigation--link",
          type: "href",
        },
      ],
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div.listing--bottom-paging",
        nav: "?p=",
        scrollToBottom: true,
        calculation: {
          method: "count",
          last: "div.listing--bottom-paging span.paging--display",
          sel: "div.listing--bottom-paging span.paging--display",
        },
      },
    ],
    productList: [
      {
        sel: "div.sr-resultList",
        productsPerPage: 60,
        productCntSel: ["span.paging--display"],
        product: {
          sel: "div.sr-resultList div.sr-resultItemTile",
          type: "not_link",
          details: [
            {
              content: "link",
              sel: "div.sr-resultItemLink a",
              type: "href",
            },
            {
              content: "image",
              sel: "div.sr-resultItemTile__imageSection img.sr-resultItemTile__image",
              type: "src",
            },
            {
              content: "name",
              sel: "div.sr-productSummary__title",
              type: "text",
            },
            {
              content: "description",
              sel: "div.sr-productSummary__description",
              type: "text",
            },
            {
              content: "price",
              sel: "div.sr-detailedPriceInfo__price",
              type: "text",
            },
          ],
        },
      },
      {
        sel: "div.offerList",
        productsPerPage: 60,
        productCntSel: ["span.paging--display"],
        product: {
          sel: "div.offerList a.offerList-itemWrapper",
          type: "link",
          details: [
            {
              content: "image",
              sel: "img",
              type: "src",
            },
            {
              content: "name",
              sel: "div.offerList-item-description-title",
              type: "text",
            },
            {
              content: "description",
              sel: "span.description-part-one",
              type: "text",
            },
            {
              content: "price",
              sel: "div.offerList-item-priceMin",
              type: "text",
            },
          ],
        },
      },
    ],
  },
  "gamestop.de": {
    manualCategories: [
      {
        name: "PS5",
        link: "https://www.gamestop.de/PS5/Index",
      },
      {
        name: "Xbox Series",
        link: "https://www.gamestop.de/XboxSeries/Index",
      },
      {
        name: "PS4",
        link: "https://www.gamestop.de/PS4/Index",
      },
      {
        name: "Xbox One",
        link: "https://www.gamestop.de/XboxOne/Index",
      },
      {
        name: "Switch",
        link: "https://www.gamestop.de/Switch/Index",
      },
      {
        name: "PC",
        link: "https://www.gamestop.de/PC/Index",
      },
    ],
    resourceTypes: {
      crawl: [
        "media",
        "font",
        "stylesheet",
        "ping",
        "image",
        "xhr",
        "fetch",
        "imageset",
        "sub_frame",
        "script",
        "other",
      ],
    },
    waitUntil: { product: "domcontentloaded", entryPoint: "domcontentloaded" },
    queryUrlSchema: [],
    d: "gamestop.de",
    mimic: "a.hamburgerLogo",
    purlschema: "Prod\\w*\\/\\d*",
    action: [],
    entryPoints: [
      {
        url: "https://www.gamestop.de",
        category: "default",
      },
    ],
    crawlActions: [],
    queryActions: [
      {
        type: "shadowroot-button",
        sel: "aside[id=usercentrics-cmp-ui]",
        btn_sel: "button[id=deny]",
        action: "click",
        wait: false,
      },
      // {
      //   type: "input",
      //   sel: "input[id=i-search-input]",
      //   wait: false,
      //   what: ["product"],
      // },
      // {
      //   type: "button",
      //   sel: "button.i-search-button--submit",
      //   action: "click",
      //   wait: false,
      // },
    ],
    categories: {
      exclude: [
        "gebraucht",
        "support",
        "trading",
        "steam",
        "streaming",
        "account",
        "merchandise",
      ],
      sel: "a.accountSideMenuListLink",
      type: "href",
      subCategories: [
        {
          sel: "div[id=categories] li a",
          type: "href",
        },
      ],
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "button.button-secondary.loadmoreBtn",
        nav: "?currentPage0=",
        scrollToBottom: true,
        calculation: {
          method: "match_text",
          textToMatch: "Weitere Artikel laden",
          dynamic: true,
          last: "button.button-secondary.loadmoreBtn",
          sel: "button.button-secondary.loadmoreBtn",
        },
      },
    ],
    productList: [
      {
        sel: "div.sr-resultList",
        productsPerPage: 60,
        productCntSel: ["span.paging--display"],
        product: {
          sel: "div.sr-resultList div.sr-resultItemTile",
          type: "not_link",
          details: [
            {
              content: "link",
              sel: "div.sr-resultItemLink a",
              type: "href",
            },
            {
              content: "image",
              sel: "div.sr-resultItemTile__imageSection img.sr-resultItemTile__image",
              type: "src",
            },
            {
              content: "name",
              sel: "div.sr-productSummary__title",
              type: "text",
            },
            {
              content: "description",
              sel: "div.sr-productSummary__description",
              type: "text",
            },
            {
              content: "price",
              sel: "div.sr-detailedPriceInfo__price",
              type: "text",
            },
          ],
        },
      },
      {
        sel: "div.offerList",
        productsPerPage: 60,
        productCntSel: ["span.paging--display"],
        product: {
          sel: "div.offerList a.offerList-itemWrapper",
          type: "link",
          details: [
            {
              content: "image",
              sel: "img",
              type: "src",
            },
            {
              content: "name",
              sel: "div.offerList-item-description-title",
              type: "text",
            },
            {
              content: "description",
              sel: "span.description-part-one",
              type: "text",
            },
            {
              content: "price",
              sel: "div.offerList-item-priceMin",
              type: "text",
            },
          ],
        },
      },
    ],
  },
  "bergfreunde.de": {
    exceptions: [
      "https://www.bergfreunde.de/out/pictures/img/bergfreunde-logo.png",
    ],
    manualCategories: [],
    pauseOnProductPage: {
      pause: true,
      min: 500,
      max: 800,
    },
    resourceTypes: {
      crawl: [
        "media",
        "font",
        // "stylesheet",
        "ping",
        "image",
        "xhr",
        "fetch",
        "imageset",
        "sub_frame",
        // "script",
        "other",
      ],
    },
    waitUntil: { product: "load", entryPoint: "load" },
    queryUrlSchema: [],
    d: "bergfreunde.de",
    mimic: "a[data-mapp-click='header.logo'] img",
    purlschema: "Prod\\w*\\/\\d*",
    action: [],
    entryPoints: [
      {
        url: "https://www.bergfreunde.de",
        category: "default",
      },
    ],
    crawlActions: [],
    queryActions: [],
    categories: {
      exclude: [],
      visible: false,
      sel: "a.level-1-link",
      type: "href",
      subCategories: [
        {
          sel: "div.list-box a.cat-title-link",
          type: "href",
        },
      ],
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div.paging",
        nav: "?p=",
        scrollToBottom: true,
        calculation: {
          method: "count",
          last: "div.paging a",
          sel: "div.paging a",
        },
      },
    ],
    productList: [
      {
        sel: "ul[id=product-list]",
        productCntSel: ["div.product-amount"],
        product: {
          sel: "ul[id=product-list] a.product-link",
          type: "link",
          details: [
            {
              content: "image",
              sel: "img.product-image",
              baseUrl:
                "https://www.bfgcdn.com/out/pictures/generated/product/1/",
              regexp: "(\\d+)_215_90\\/(.*?)\\s",
              type: "srcset",
            },
            {
              content: "name",
              sel: "ul[id=product-list] a.product-link div.product-infobox",
              type: "text",
            },
            {
              content: "description",
              sel: "div.sr-productSummary__description",
              type: "text",
            },
            {
              content: "price",
              sel: "div.product-price",
              type: "text",
            },
          ],
        },
      },
    ],
  },
  "action.com": {
    manualCategories: [],
    resourceTypes: {
      crawl: [
        "media",
        "font",
        "stylesheet",
        "ping",
        "image",
        "xhr",
        "fetch",
        "imageset",
        "sub_frame",
        "script",
        "other",
      ],
    },
    waitUntil: { product: "domcontentloaded", entryPoint: "domcontentloaded" },
    queryUrlSchema: [],
    d: "action.com",
    mimic: "nav[data-testid='top-menu'] a svg.h-6",
    purlschema: "Prod\\w*\\/\\d*",
    action: [],
    entryPoints: [
      {
        url: "https://www.action.com/de-de",
        category: "default",
      },
    ],
    crawlActions: [],
    queryActions: [],
    categories: {
      exclude: [],
      sel: "li[data-section-type=CategoryMenuItem] a",
      type: "href",
      subCategories: [
        {
          sel: "div[data-testid=grid-navigation-links] a",
          type: "href",
        },
      ],
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div[data-testid=grid-pagination-items-desktop]",
        nav: "?page=",
        scrollToBottom: true,
        calculation: {
          method: "count",
          last: "div[data-testid=grid-pagination-items-desktop] a",
          sel: "div[data-testid=grid-pagination-items-desktop] a",
        },
      },
    ],
    productList: [
      {
        sel: "div.sr-resultList",
        productsPerPage: 28,
        productCntSel: ["p.text-center.text-xs"],
        product: {
          sel: "div.sr-resultList div.sr-resultItemTile",
          type: "not_link",
          details: [
            {
              content: "link",
              sel: "div.sr-resultItemLink a",
              type: "href",
            },
            {
              content: "image",
              sel: "div.sr-resultItemTile__imageSection img.sr-resultItemTile__image",
              type: "src",
            },
            {
              content: "name",
              sel: "div.sr-productSummary__title",
              type: "text",
            },
            {
              content: "description",
              sel: "div.sr-productSummary__description",
              type: "text",
            },
            {
              content: "price",
              sel: "div.sr-detailedPriceInfo__price",
              type: "text",
            },
          ],
        },
      },
      {
        sel: "div.offerList",
        productsPerPage: 28,
        productCntSel: ["p.text-center.text-xs"],
        product: {
          sel: "div.offerList a.offerList-itemWrapper",
          type: "link",
          details: [
            {
              content: "image",
              sel: "img",
              type: "src",
            },
            {
              content: "name",
              sel: "div.offerList-item-description-title",
              type: "text",
            },
            {
              content: "description",
              sel: "span.description-part-one",
              type: "text",
            },
            {
              content: "price",
              sel: "div.offerList-item-priceMin",
              type: "text",
            },
          ],
        },
      },
    ],
  },
  "costway.de": {
    manualCategories: [
      {
        name: "Mega Woche",
        link: "https://www.costway.de/mega-woche?entrypoint=hotwords",
      },
      {
        name: "Ausverkauf",
        link: "https://www.costway.de/ausverkauf?entrypoint=hotwords",
      },
    ],
    resourceTypes: {
      crawl: [
        "media",
        "font",
        "stylesheet",
        "ping",
        "image",
        "xhr",
        "fetch",
        "imageset",
        "sub_frame",
        "script",
        "other",
      ],
    },
    waitUntil: { product: "domcontentloaded", entryPoint: "domcontentloaded" },
    queryUrlSchema: [],

    d: "costway.de",
    mimic: "img[title='COSTWAY']",
    purlschema: "Prod\\w*\\/\\d*",
    action: [],
    entryPoints: [
      {
        url: "https://www.costway.de",
        category: "default",
      },
    ],
    crawlActions: [],
    queryActions: [],
    categories: {
      exclude: ["alle"],
      sel: "a.top-nav",
      type: "href",
      subCategories: [
        {
          sel: "div.catalog-sub-menu div.ant-col a",
          type: "href",
        },
      ],
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div.pages",
        nav: "?p=",
        scrollToBottom: true,
        calculation: {
          method: "count",
          dynamic: true,
          last: "div.pages li.item a.page",
          sel: "div.pages li.item a.page",
        },
      },
    ],
    productList: [
      {
        sel: "div.products-grid",
        productCntSel: [
          "ul.items.pages-items li:not(.page-item-next):nth-last-child(2)",
        ],
        product: {
          sel: "div.products-grid li.product-item",
          type: "not_link",
          details: [
            {
              content: "link",
              sel: "div.imgage-box a",
              type: "href",
            },
            {
              content: "image",
              sel: "div.imgage-box img",
              type: "data-original",
            },
            {
              content: "name",
              proprietaryProducts: "COSTWAY",
              sel: "a.product-item-link",
              type: "title",
            },
            {
              content: "price",
              sel: "span.price",
              type: "text",
            },
          ],
        },
      },

      {
        sel: "div.seemore-fivelist",
        productCntSel: [
          "ul.items.pages-items li:not(.page-item-next):nth-last-child(2)",
        ],
        product: {
          sel: "div.seemore-fivelist li.pro_sku",
          type: "not_link",
          details: [
            {
              content: "link",
              sel: "a.pro_link",
              type: "href",
            },
            {
              content: "image",
              sel: "img.pro_img",
              type: "src",
            },
            {
              content: "name",
              sel: "p.productText",
              proprietaryProducts: "COSTWAY",
              type: "text",
            },
            {
              content: "price",
              sel: "span.now-price",
              type: "text",
            },
          ],
        },
      },
    ],
  },
  "cyberport.de": {
    manualCategories: [
      {
        name: "Angebote",
        link: "https://www.cyberport.de/angebote.html",
      },
      {
        name: "Restposten (A-Ware)",
        link: "https://www.cyberport.de/markenshops/outlet/restposten-a-ware-.html",
      },
      {
        name: "Gebrauchtware (B-Ware)",
        link: "https://www.cyberport.de/markenshops/outlet/gebrauchtware-b-ware-.html",
      },
    ],
    resourceTypes: {
      crawl: [
        "media",
        "font",
        "stylesheet",
        "ping",
        "image",
        "xhr",
        "fetch",
        "imageset",
        "sub_frame",
        "script",
        "other",
      ],
    },
    waitUntil: { product: "load", entryPoint: "load" },
    queryUrlSchema: [],
    d: "cyberport.de",
    mimic: "svg.cpHeaderLogo__svg",
    purlschema: "Prod\\w*\\/\\d*",
    action: [],
    entryPoints: [
      {
        url: "https://www.cyberport.de",
        category: "default",
      },
    ],
    crawlActions: [],
    queryActions: [],

    categories: {
      exclude: [
        "service-garantien",
        "content-creator",
        "tech-week",
        "nfl.html",
        "lexikon",
        "newsletter",
        "digitales-lernen",
        "kaufberatung",
        "gutscheine",
        "abo",
        "zurueck",
        "konfiguration",
        "service",
        "zurück",
        "stores",
        "kontakt",
        "einstellungen",
        "tipps zum stöbern",
        "newsletter",
      ],
      sel: "#top > header > div.mainNavigation > div > div:nth-child(1) > div > div > nav > ul > li.nav-main-primary.nav-main-md-plus-devices > ul > li > a",
      type: "href",
      basepath: true,
      subCategories: [
        {
          visible: false,
          sel: "li:is(.levelFirst,.levelSecond) a",
          type: "href",
        },
      ],
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div.paging",
        nav: "?p=",
        scrollToBottom: true,
        calculation: {
          method: "count",
          last: "div.paging a",
          sel: "div.paging a",
        },
      },
    ],
    productList: [
      {
        sel: "div.productsList",
        productCntSel: ["span.resultCount"],
        product: {
          sel: "div.productsList article.productArticle",
          type: "not_link",
          details: [
            {
              content: "link",
              sel: "a.head.heading-level3",
              type: "href",
            },
            {
              content: "image",
              sel: "div.productImage img",
              type: "srcset",
            },
            {
              content: "name",
              sel: "h3.productTitleName",
              type: "text",
            },
            {
              content: "description",
              sel: "div[class=productinfobox] ul",
              type: "text",
            },
            {
              content: "price",
              sel: "div.delivery-price",
              type: "text",
            },
          ],
        },
      },
      // {
      //   sel: "div.offerList",
      //   productCntSel: ["span.resultCount"],
      //   product: {
      //     sel: "div.offerList a.offerList-itemWrapper",
      //     type: "link",
      //     details: [
      //       {
      //         content: "image",
      //         sel: "img",
      //         type: "src",
      //       },
      //       {
      //         content: "name",
      //         sel: "div.offerList-item-description-title",
      //         type: "text",
      //       },
      //       {
      //         content: "description",
      //         sel: "span.description-part-one",
      //         type: "text",
      //       },
      //       {
      //         content: "price",
      //         sel: "div.offerList-item-priceMin",
      //         type: "text",
      //       },
      //     ],
      //   },
      // },
    ],
  },
  "dm.de": {
    manualCategories: [],
    resourceTypes: {
      crawl: [
        "media",
        "font",
        "stylesheet",
        "ping",
        "image",
        // "xhr",
        "fetch",
        "imageset",
        "sub_frame",
        // "script",
        "other",
      ],
    },
    waitUntil: { product: "load", entryPoint: "load" },
    queryUrlSchema: [],
    d: "dm.de",
    mimic: "svg[data-dmid=dm-brand]",
    purlschema: "Prod\\w*\\/\\d*",
    action: [],
    entryPoints: [
      {
        url: "https://www.dm.de",
        category: "default",
      },
    ],
    crawlActions: [],
    queryActions: [],
    categories: {
      exclude: ["marken"],
      sel: "nav[id=categoryNavigationContainer] a",
      visible: false,
      type: "href",
      subCategories: [
        {
          sel: "a[data-dmid=on-page-navigation-item]",
          visible: false,
          type: "href",
        },
      ],
    },
    paginationEl: [
      {
        type: "recursive-more-button",
        sel: "button[data-dmid=load-more-products-button]",
        nav: "?currentPage0=",
        wait: false,
        scrollToBottom: true,
        calculation: {
          method: "match_text",
          textToMatch: "Mehr laden",
          dynamic: true,
          last: "button[data-dmid=load-more-products-button]",
          sel: "button[data-dmid=load-more-products-button]",
        },
      },
    ],
    productList: [
      {
        sel: "div[data-dmid=product-grid-container]",
        productCntSel: ["span[data-dmid=total-count]"],
        awaitProductCntSel: true,
        product: {
          sel: "div[data-dmid=product-grid-container] div[data-dmid=product-tile-container]",
          type: "not_link",
          details: [
            {
              content: "link",
              sel: "a[class*=pdd_]",
              type: "href",
            },
            {
              content: "image",
              sel: "img[class*=pdd_]",
              type: "src",
            },
            {
              content: "name",
              sel: "div[data-dmid=product-description] a",
              type: "text",
            },
            {
              content: "mnfctr",
              sel: "span[data-dmid=product-brand]",
              type: "text",
            },
            {
              content: "price",
              sel: "span[data-dmid=price-localized]",
              type: "text",
            },
          ],
        },
      },
      {
        sel: "div.offerList",
        productCntSel: ["span[data-dmid=total-count]"],
        product: {
          sel: "div.offerList a.offerList-itemWrapper",
          type: "link",
          details: [
            {
              content: "image",
              sel: "img",
              type: "src",
            },
            {
              content: "name",
              sel: "div.offerList-item-description-title",
              type: "text",
            },
            {
              content: "description",
              sel: "span.description-part-one",
              type: "text",
            },
            {
              content: "price",
              sel: "div.offerList-item-priceMin",
              type: "text",
            },
          ],
        },
      },
    ],
  },
  "fahrrad.de": {
    manualCategories: [],
    resourceTypes: {
      crawl: [
        "media",
        "font",
        "stylesheet",
        "ping",
        "image",
        "xhr",
        "fetch",
        "imageset",
        "sub_frame",
        "script",
        "other",
      ],
    },
    waitUntil: { product: "domcontentloaded", entryPoint: "domcontentloaded" },
    queryUrlSchema: [],
    d: "fahrrad.de",
    mimic: "a.logo",
    purlschema: "Prod\\w*\\/\\d*",
    action: [],
    entryPoints: [
      {
        url: "https://www.fahrrad.de",
        category: "default",
      },
    ],
    crawlActions: [],
    queryActions: [],
    categories: {
      exclude: ["aktivitäten", "marken", "service & beratung"],
      sel: "ul.menu-category li.li-level-1 a.a-level-1",
      type: "href",
      subCategories: [
        {
          sel: "div[id=newcategorychips] a",
          type: "href",
        },
      ],
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "ul.pagination__list",
        nav: "?page=",
        calculation: {
          method: "count",
          last: "ul.pagination__list a",
          sel: "ul.pagination__list a",
        },
      },
    ],
    productList: [
      {
        sel: "div.sr-resultList",
        productCntSel: ["span.js-articleAmount"],
        product: {
          sel: "div.sr-resultList div.sr-resultItemTile",
          type: "not_link",
          details: [
            {
              content: "link",
              sel: "div.sr-resultItemLink a",
              type: "href",
            },

            {
              content: "image",
              sel: "div.sr-resultItemTile__imageSection img.sr-resultItemTile__image",
              type: "src",
            },
            {
              content: "name",
              sel: "div.sr-productSummary__title",
              type: "text",
            },
            {
              content: "description",
              sel: "div.sr-productSummary__description",
              type: "text",
            },
            {
              content: "price",
              sel: "div.sr-detailedPriceInfo__price",
              type: "text",
            },
          ],
        },
      },
      {
        sel: "div.offerList",
        productCntSel: ["span.js-articleAmount"],
        product: {
          sel: "div.offerList a.offerList-itemWrapper",
          type: "link",
          details: [
            {
              content: "image",
              sel: "img",
              type: "src",
            },
            {
              content: "name",
              sel: "div.offerList-item-description-title",
              type: "text",
            },
            {
              content: "description",
              sel: "span.description-part-one",
              type: "text",
            },
            {
              content: "price",
              sel: "div.offerList-item-priceMin",
              type: "text",
            },
          ],
        },
      },
    ],
  },
  "fressnapf.de": {
    manualCategories: [
      {
        name: "Sale",
        link: "https://www.fressnapf.de/aktionen-angebote/sale/",
      },
      {
        name: "Preisknaller",
        link: "https://www.fressnapf.de/aktionen-angebote/preiskraller/",
      },
      {
        name: "Gutschein & Zubehör",
        link: "https://www.fressnapf.de/aktionen-angebote/gutschein-zubehoer/",
      },
    ],
    resourceTypes: {
      crawl: [
        "media",
        "font",
        "stylesheet",
        "ping",
        "image",
        "xhr",
        "fetch",
        "imageset",
        "sub_frame",
        // "script",
        "other",
      ],
    },
    javascript: {
      sharedWorker: 'enabled',
      webWorker: 'enabled',
      serviceWorker: 'disabled',
    },
    waitUntil: { product: "load", entryPoint: "load" },
    queryUrlSchema: [],
    d: "fressnapf.de",
    mimic: "a[id=header-logo]",
    purlschema: "Prod\\w*\\/\\d*",
    action: [],
    entryPoints: [
      {
        url: "https://www.fressnapf.de",
        category: "default",
      },
    ],
    crawlActions: [],
    queryActions: [],

    categories: {
      exclude: ["service", "magazin"],
      sel: "div[id=__navigation] ul.nav-level-1 a",
      type: "href",
      subCategories: [
        {
          sel: "div.teaser-slider-small div.swiper-wrapper a.swiper-slide",
          type: "href"
        },
      ],
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div.p-items",
        nav: "?currentPage=",
        calculation: {
          method: "count",
          last: "div.p-items a",
          sel: "div.p-items a",
        },
      },
    ],
    productList: [
      {
        sel: "div.grid-container.product-grid",
        productCntSel: ["div.divider > div"],
        product: {
          sel: "div.grid-container.product-grid div.product-teaser",
          type: "not_link",
          details: [
            {
              content: "link",
              sel: "div.pt-content a",
              type: "href",
            },

            {
              content: "image",
              sel: "div.pt-figure img",
              type: "src",
            },

            {
              content: "name",
              sel: "div.pt-head",
              type: "text",
            },
            {
              content: "mnfctr",
              sel: "div.pt-subhead",
              type: "text",
            },
            {
              content: "price",
              sel: "div.p-price",
              type: "text",
            },
          ],
        },
      },
      // {
      //   sel: "div.offerList",
      //   productCntSel: ["div[data-v-0725ff23][data-v-133f7958]"],
      //   product: {
      //     sel: "div.offerList a.offerList-itemWrapper",
      //     type: "link",
      //     details: [
      //       {
      //         content: "image",
      //         sel: "img",
      //         type: "src",
      //       },
      //       {
      //         content: "name",
      //         sel: "div.offerList-item-description-title",
      //         type: "text",
      //       },
      //       {
      //         content: "description",
      //         sel: "span.description-part-one",
      //         type: "text",
      //       },
      //       {
      //         content: "price",
      //         sel: "div.offerList-item-priceMin",
      //         type: "text",
      //       },
      //     ],
      //   },
      // },
    ],
  },
  "mindfactory.de": {
    manualCategories: [],
    resourceTypes: {
      crawl: [
        "media",
        "font",
        "stylesheet",
        "ping",
        "image",
        "xhr",
        "fetch",
        "imageset",
        "sub_frame",
        "script",
        "other",
      ],
    },
    waitUntil: { product: "domcontentloaded", entryPoint: "domcontentloaded" },
    queryUrlSchema: [],
    d: "mindfactory.de",
    mimic: "#bToprow > div.row > div.col-logo > div > a > img",
    purlschema: "Prod\\w*\\/\\d*",
    action: [],
    entryPoints: [
      {
        url: "https://www.mindfactory.de",
        category: "default",
      },
    ],
    crawlActions: [],
    queryActions: [],
    categories: {
      exclude: ["mindstart", "actionen"],
      sel: "div[id=navbar-menu-topcategories] a[data-toggle=load-category]",
      type: "href",
      subCategories: [
        {
          sel: "div.cn-categoryGrid div.cn-categoryGridItem a:has(div.cn-categoryGridItem__title)",
          type: "href",
        },
      ],
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "ul.pagination",
        nav: "/page/",
        scrollToBottom: true,
        calculation: {
          method: "find_highest",
          last: "ul.pagination a",
          sel: "ul.pagination a",
        },
      },
    ],
    productList: [
      {
        sel: "div.sr-resultList",
        productCntSel: [
          "div.show-articles-per-page-top span.bold:nth-child(3)",
        ],
        product: {
          sel: "div.sr-resultList div.sr-resultItemTile",
          type: "not_link",
          details: [
            {
              content: "link",
              sel: "div.sr-resultItemLink a",
              type: "href",
            },

            {
              content: "image",
              sel: "div.sr-resultItemTile__imageSection img.sr-resultItemTile__image",
              type: "src",
            },
            {
              content: "name",
              sel: "div.sr-productSummary__title",
              type: "text",
            },
            {
              content: "description",
              sel: "div.sr-productSummary__description",
              type: "text",
            },
            {
              content: "price",
              sel: "div.sr-detailedPriceInfo__price",
              type: "text",
            },
          ],
        },
      },
      {
        sel: "div.offerList",
        productCntSel: [
          "div.show-articles-per-page-top span.bold:nth-child(3)",
        ],
        product: {
          sel: "div.offerList a.offerList-itemWrapper",
          type: "link",
          details: [
            {
              content: "image",
              sel: "img",
              type: "src",
            },
            {
              content: "name",
              sel: "div.offerList-item-description-title",
              type: "text",
            },
            {
              content: "description",
              sel: "span.description-part-one",
              type: "text",
            },
            {
              content: "price",
              sel: "div.offerList-item-priceMin",
              type: "text",
            },
          ],
        },
      },
    ],
  },
  "mueller.de": {
    manualCategories: [],
    resourceTypes: {
      crawl: [
        "media",
        "font",
        "ping",
        "image",
        "xhr",
        "fetch",
        "imageset",
        "sub_frame",
        "other",
      ],
    },
    waitUntil: { product: "load", entryPoint: "load" },
    queryUrlSchema: [],
    d: "mueller.de",
    mimic: "img.mu-header__logo",
    purlschema: "Prod\\w*\\/\\d*",
    action: [],
    entryPoints: [
      {
        url: "https://www.mueller.de",
        category: "default",
      },
    ],
    crawlActions: [],
    queryActions: [],
    categories: {
      exclude: [
        "marken",
        "foto",
        "mobilfunk",
        "information",
        "exklusiv",
        "alle",
      ],
      wait: 14000,
      visible: false,
      sel: "li:not(.mu-navigation__item--all) a:is(.mu-navigation__link,.mu-navigation__special-link)",
      type: "href",
      subCategories: [
        {
          sel: "a.mu-category-overview-desktop__link.mu-category-overview-desktop__link--main",
          type: "href",
        },
      ],
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div.mu-pagination__pages",
        nav: "?p=",
        scrollToBottom: true,
        calculation: {
          method: "count",
          last: "div.mu-pagination__pages span.mu-button2__content",
          sel: "div.mu-pagination__pages span.mu-button2__content",
        },
      },
    ],
    productList: [
      {
        sel: "div.mu-product-list__items",
        productCntSel: ["span.mu-product-list-page__headline-count"],
        product: {
          sel: "a.mu-product-tile.mu-product-list__item",
          type: "link",
          details: [
            {
              content: "image",
              sel: "img.mu-product-tile__image",
              type: "src",
            },
            {
              content: "name",
              sel: "div.mu-product-tile__name",
              type: "text",
            },

            {
              content: "price",
              sel: "span.mu-product-tile__price",
              type: "text",
            },
            {
              content: "promoPrice",
              sel: "span.mu-product-tile__price--promo",
              type: "text",
            },
          ],
        },
      },
    ],
  },
  "quelle.de": {
    manualCategories: [
      {
        name: "Deals des Monats",
        link: "https://www.quelle.de/themen-aktionen/sale/deals-des-monats",
      },
    ],
    resourceTypes: {
      crawl: [
        "media",
        "font",
        "stylesheet",
        "ping",
        "image",
        "xhr",
        "fetch",
        "imageset",
        "sub_frame",
        "script",
        "other",
      ],
    },
    waitUntil: { product: "domcontentloaded", entryPoint: "domcontentloaded" },
    queryUrlSchema: [],
    d: "quelle.de",
    mimic: "header > a > svg",
    purlschema: "Prod\\w*\\/\\d*",
    action: [],
    entryPoints: [
      {
        url: "https://www.quelle.de",
        category: "default",
      },
    ],
    crawlActions: [],
    queryActions: [],
    categories: {
      exclude: [],
      sel: "nav div[data-testid=stack] a.MuiTypography-root",
      type: "href",
      subCategories: [
        {
          sel: "div.MuiGrid-root.MuiGrid-item.MuiGrid-grid-lg-1.css-15dky00 > ul > a",
          type: "href",
        },
      ],
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "nav.MuiPagination-root",
        nav: "?p=",
        scrollToBottom: true,
        calculation: {
          method: "count",
          last: "nav.MuiPagination-root li",
          sel: "nav.MuiPagination-root li",
        },
      },
    ],
    productList: [
      {
        sel: "div.sr-resultList",
        productCntSel: ["ol.MuiBreadcrumbs-ol li:last-child"],
        product: {
          sel: "div.sr-resultList div.sr-resultItemTile",
          type: "not_link",
          details: [
            {
              content: "link",
              sel: "div.sr-resultItemLink a",
              type: "href",
            },

            {
              content: "image",
              sel: "div.sr-resultItemTile__imageSection img.sr-resultItemTile__image",
              type: "src",
            },
            {
              content: "name",
              sel: "div.sr-productSummary__title",
              type: "text",
            },
            {
              content: "description",
              sel: "div.sr-productSummary__description",
              type: "text",
            },
            {
              content: "price",
              sel: "div.sr-detailedPriceInfo__price",
              type: "text",
            },
          ],
        },
      },
      {
        sel: "div.offerList",
        productCntSel: ["ol.MuiBreadcrumbs-ol li:last-child"],
        product: {
          sel: "div.offerList a.offerList-itemWrapper",
          type: "link",
          details: [
            {
              content: "image",
              sel: "img",
              type: "src",
            },
            {
              content: "name",
              sel: "div.offerList-item-description-title",
              type: "text",
            },
            {
              content: "description",
              sel: "span.description-part-one",
              type: "text",
            },
            {
              content: "price",
              sel: "div.offerList-item-priceMin",
              type: "text",
            },
          ],
        },
      },
    ],
  },
  "reichelt.de": {
    ece: ["/&SID=(\\d|\\w)+/g"],
    manualCategories: [],
    resourceTypes: {
      crawl: [
        "media",
        "font",
        "stylesheet",
        "ping",
        "image",
        "xhr",
        "fetch",
        "imageset",
        "sub_frame",
        // "script",
        "other",
      ],
    },
    waitUntil: { product: "load", entryPoint: "load" },
    queryUrlSchema: [],
    query: {
      content: "van",
    },
    d: "reichelt.de",
    mimic: "label[for=loginb]",
    purlschema: "Prod\\w*\\/\\d*",
    action: [],
    entryPoints: [
      {
        url: "https://www.reichelt.de",
        category: "default",
      },
    ],
    crawlActions: [],
    queryActions: [],
    categories: {
      categoryNameSegmentPos: 0,
      categoryRegexp: "\\/([^\\/]+?)-c\\d+",
      exclude: [
        "kategorie",
        "gruppen",
        "artikel",
        "filename",
        "informationen",
        "sicherheitsnormen",
      ],
      sel: "a:is(.rootgroups,.rtgrps,.nwmshp,.sale)",
      type: "href",
      subCategories: [
        {
          sel: "ul[id=pictogramm] li.pre[class*=pictogramm_] a",
          type: "href",
        },
        {
          sel: "div[id=gov_groupview] a",
          type: "href",
        },
      ],
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div.PageLinksNavi",
        nav: ".html?ACTION=2&GROUPID=<groupid>&START=<page>&OFFSET=30&nbc=1",
        scrollToBottom: true,
        paginationUrlSchema: {
          replace: "\\.html",
          parseAndReplace: { regexp: "\\d+", replace: "<groupid>" },
          withQuery: false,
          calculation: {
            method: "offset",
            offset: 30,
          },
        },
        calculation: {
          method: "count",
          last: "div.PageLinksNavi button:is(.SiteLinks,.SiteLinksDouble)",
          sel: "div.PageLinksNavi button:is(.SiteLinks,.SiteLinksDouble)",
        },
      },
    ],
    productList: [
      {
        sel: "div[id=al_artikellist]",
        productCntSel: [
          "div.show-articles-per-page-top span.bold:nth-child(3)",
        ],
        product: {
          sel: "div.al_gallery_article",
          type: "not_link",
          details: [
            {
              content: "link",
              sel: "a.al_artinfo_link",
              type: "href",
            },
            {
              content: "image",
              sel: "div.al_artlogo img[data-original]",
              type: "data-original",
            },
            {
              content: "van",
              sel: "meta[itemprop=productID]",
              type: "content",
            },
            {
              content: "name",
              sel: "a.al_artinfo_link",
              type: "title",
            },
            {
              content: "description",
              sel: "ul[itemprop=description]",
              type: "text",
            },
            {
              content: "price",
              sel: "span[itemprop=price]",
              type: "text",
            },
          ],
        },
      },
      {
        sel: "div.articlestage_02",
        productCntSel: [
          "div.show-articles-per-page-top span.bold:nth-child(3)",
        ],
        product: {
          sel: "article a",
          type: "link",
          details: [
            {
              content: "image",
              sel: "div.al_artlogo img[data-original]",
              type: "data-original",
            },
            {
              content: "van",
              sel: "meta[itemprop=productID]",
              type: "content",
            },
            {
              content: "name",
              sel: "div.hghlght",
              type: "text",
            },
            {
              content: "description",
              sel: "p.short_text",
              type: "text",
            },
            {
              content: "price",
              sel: "span.pricetag",
              type: "text",
            },
          ],
        },
      },
      {
        sel: "section.swiper-wrapper",
        productCntSel: [
          "div.show-articles-per-page-top span.bold:nth-child(3)",
        ],
        product: {
          sel: "article a",
          type: "link",
          details: [
            {
              content: "image",
              sel: "img",
              type: "src",
            },
            {
              content: "van",
              sel: "meta[itemprop=productID]",
              type: "content",
            },
            {
              content: "name",
              sel: "div.hghlght",
              type: "text",
            },
            {
              content: "description",
              sel: "p.short_text",
              type: "text",
            },
            {
              content: "price",
              sel: "span.oldprice",
              type: "text",
            },
            {
              content: "promoPrice",
              sel: "span.prc",
              type: "text",
            },
          ],
        },
      },
    ],
  },
  "saturn.de": {
    manualCategories: [
      [
        {
          name: "Angebote & Aktionen",
          link: "https://www.saturn.de/de/campaign/angebote-aktionen",
        },
        {
          name: "OUTLET%",
          link: "https://www.saturn.de/de/campaign/restposten",
        },
        {
          name: "Computer + Tablet",
          link: "https://www.saturn.de/de/category/computer-tablet-1.html",
        },
        {
          name: "Smartphone + Tarife",
          link: "https://www.saturn.de/de/category/smartphones-tarife-467.html",
        },
        {
          name: "TV + Beamer",
          link: "https://www.saturn.de/de/category/tv-beamer-1069.html",
        },
        {
          name: "Küche",
          link: "https://www.saturn.de/de/category/haushalt-küche-bad-1197.html",
        },
        {
          name: "Haushalt + Garten",
          link: "https://www.saturn.de/de/category/haushalt-garten-707.html",
        },
        {
          name: "Gaming + VR",
          link: "https://www.saturn.de/de/specials/gaming-welt",
        },
        {
          name: "Audio",
          link: "https://www.saturn.de/de/category/audio-2511.html",
        },
        {
          name: "Kameras + Foto",
          link: "https://www.saturn.de/de/category/kameras-foto-356.html",
        },
        {
          name: "Fitness + Gesundheit",
          link: "https://www.saturn.de/de/category/fitness-gesundheit-700.html",
        },
        {
          name: "Beauty + Wellness",
          link: "https://www.saturn.de/de/category/beauty-wellness-706.html",
        },
        {
          name: "Spielzeug + Freizeit",
          link: "https://www.saturn.de/de/category/spielzeug-freizeit-2492.html",
        },
        {
          name: "Büro + Homeoffice",
          link: "https://www.saturn.de/de/category/büro-kommunikation-2820.html",
        },
        {
          name: "Filme + Musik",
          link: "https://www.saturn.de/de/category/film-serien-musik-994.html",
        },
        {
          name: "Smart Home",
          link: "https://www.saturn.de/de/category/smart-home-5000.html",
        },
        {
          name: "Erneuerbare Energien",
          link: "https://www.saturn.de/de/category/erneuerbare-energien-9000.html",
        },
        {
          name: "Refurbished",
          link: "https://www.saturn.de/de/campaign/refurbished",
        },
      ],
    ],
    // rules:[
    //   {
    //     description: "Abort if consent layer is present",
    //     action: "abort",
    //     conditions: [
    //       {
    //         type: "includes",
    //         value:
    //           "ConsentLayer",
    //       },
    //     ],
    //   },
    // ],
    resourceTypes: {
      crawl: [
        "media",
        "font",
        // "stylesheet",
        "ping",
        "image",
        "xhr",
        // "fetch",
        "imageset",
        "sub_frame",
        // "script",
        "other",
      ],
    },
    waitUntil: { product: "load", entryPoint: "load" },
    queryUrlSchema: [],
    d: "saturn.de",
    mimic: "img[data-test=styled-logo]",
    purlschema: "Prod\\w*\\/\\d*",
    action: [],
    entryPoints: [
      {
        url: "https://www.saturn.de",
        category: "default",
      },
    ],
    crawlActions: [
      {
        type: "element",
        sel: "div[id=mms-consent-portal-container]",
        action: "delete",
        interval: 300,
      },
    ],
    queryActions: [],
    categories: {
      exclude: ["mindstart", "actionen"],
      sel: "div[id=navbar-menu-topcategories] a[data-toggle=load-category]",
      type: "href",
      subCategories: [
        {
          sel: "a[data-test=mms-search-category-content-sidenav-link]",
          type: "href",
        },
        {
          sel: "a[data-test=mms-router-link]",
          type: "href",
        },
      ],
    },
    paginationEl: [
      {
        type: "recursive-more-button",
        sel: "button[aria-label='Mehr Produkte anzeigen']",
        nav: "?page=",
        scrollToBottom: true,
        calculation: {
          method: "find_highest",
          last: "button[aria-label='Mehr Produkte anzeigen']",
          sel: "button[aria-label='Mehr Produkte anzeigen']",
        },
      },
    ],
    productList: [
      {
        sel: "div[data-test=mms-search-srp-productlist]",
        productCntSel: ["section[data-test=mms-search-srp-headlayout] div"],
        product: {
          sel: "div[data-test=mms-search-srp-productlist] div[data-test=mms-product-card]",
          type: "not_link",
          details: [
            {
              content: "link",
              sel: "a[data-test=mms-product-list-item-link]",
              type: "href",
            },
            {
              content: "image",
              sel: "picture[data-test=product-image] img",
              type: "src",
            },
            {
              content: "name",
              sel: "div[title] p",
              type: "text",
            },
            {
              content: "description",
              sel: "div.sr-productSummary__description",
              type: "text",
            },
            {
              content: "price",
              sel: "div[data-test=product-price] span[spacing=base]",
              type: "text",
            },
          ],
        },
      },
      {
        sel: "div.offerList",
        productCntSel: [
          "div.show-articles-per-page-top span.bold:nth-child(3)",
        ],
        product: {
          sel: "div.offerList a.offerList-itemWrapper",
          type: "link",
          details: [
            {
              content: "image",
              sel: "img",
              type: "src",
            },
            {
              content: "name",
              sel: "div.offerList-item-description-title",
              type: "text",
            },
            {
              content: "description",
              sel: "span.description-part-one",
              type: "text",
            },
            {
              content: "price",
              sel: "div.offerList-item-priceMin",
              type: "text",
            },
          ],
        },
      },
    ],
  },
  "sportspar.de": {
    manualCategories: [
      {
        name: "Neuheiten",
        link: "https://www.sportspar.de/neuheiten",
      },
      {
        name: "Topseller",
        link: "https://www.sportspar.de/topseller",
      },
      {
        name: "Top-100",
        link: "https://sportspar.de/top-100",
      },
    ],
    resourceTypes: {
      crawl: [
        "media",
        "font",
        "stylesheet",
        "ping",
        "image",
        "xhr",
        "fetch",
        "imageset",
        "sub_frame",
        "script",
        "other",
      ],
    },
    waitUntil: { product: "domcontentloaded", entryPoint: "domcontentloaded" },
    queryUrlSchema: [],
    d: "sportspar.de",
    mimic: "#bToprow > div.row > div.col-logo > div > a > img",
    purlschema: "Prod\\w*\\/\\d*",
    action: [],
    entryPoints: [
      {
        url: "https://www.sportspar.de",
        category: "default",
      },
    ],
    crawlActions: [],
    queryActions: [],
    categories: {
      exclude: ["sparclub", "service", "marken", "weitere"],
      sel: "nav.navigation-main li.navigation--entry.is--active.has--sub-categories.js--menu-scroller--item",
      type: "href",
      subCategories: [
        {
          sel: "ul.sidebar--navigation li.navigation--entry > a.navigation--link.link--go-forward",
          type: "href",
        },
      ],
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "a.btn.is--primary.is--icon-right.js--load-more",
        nav: "?p=",
        scrollToBottom: true,
        calculation: {
          method: "match_text",
          textToMatch: "Weitere Artikel laden",
          dynamic: true,
          last: "a.btn.is--primary.is--icon-right.js--load-more",
          sel: "a.btn.is--primary.is--icon-right.js--load-more",
        },
      },
    ],
    productList: [
      {
        sel: "div.sr-resultList",
        productCntSel: [],
        product: {
          sel: "div.sr-resultList div.sr-resultItemTile",
          type: "not_link",
          details: [
            {
              content: "link",
              sel: "div.sr-resultItemLink a",
              type: "href",
            },

            {
              content: "image",
              sel: "div.sr-resultItemTile__imageSection img.sr-resultItemTile__image",
              type: "src",
            },
            {
              content: "name",
              sel: "div.sr-productSummary__title",
              type: "text",
            },
            {
              content: "description",
              sel: "div.sr-productSummary__description",
              type: "text",
            },
            {
              content: "price",
              sel: "div.sr-detailedPriceInfo__price",
              type: "text",
            },
          ],
        },
      },
      {
        sel: "div.offerList",
        productCntSel: [],
        product: {
          sel: "div.offerList a.offerList-itemWrapper",
          type: "link",
          details: [
            {
              content: "image",
              sel: "img",
              type: "src",
            },
            {
              content: "name",
              sel: "div.offerList-item-description-title",
              type: "text",
            },
            {
              content: "description",
              sel: "span.description-part-one",
              type: "text",
            },
            {
              content: "price",
              sel: "div.offerList-item-priceMin",
              type: "text",
            },
          ],
        },
      },
    ],
  },
  "weltbild.de": {
    manualCategories: [],
    resourceTypes: {
      crawl: [
        "media",
        "font",
        "stylesheet",
        "ping",
        "image",
        "xhr",
        "fetch",
        "imageset",
        "sub_frame",
        "script",
        "other",
      ],
    },
    waitUntil: { product: "load", entryPoint: "load" },
    queryUrlSchema: [],
    d: "weltbild.de",
    mimic: "img[alt=Weltbild]",
    purlschema: "",
    action: [],
    entryPoints: [
      {
        url: "https://www.weltbild.de",
        category: "default",
      },
    ],
    crawlActions: [],
    queryActions: [],
    categories: {
      exclude: ["Nur bei weltbild", "alles"],
      sel: "nav.nav-container a.nav-link",
      type: "href",
      subCategories: [
        {
          sel: "section.sx-box.listnavigation a:not(.current)",
          type: "href",
        },
      ],
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div.pagination",
        nav: "?seite=",
        scrollToBottom: true,
        calculation: {
          method: "count",
          last: "div.pagination li a",
          sel: "div.pagination li a",
        },
      },
    ],
    productList: [
      {
        sel: "div[property=list]",
        productCntSel: ["span.article-count"],
        product: {
          sel: "div[property=list] div.sr-resultItemTile",
          type: "link",
          details: [
            {
              content: "image",
              sel: "div.image-container img",
              type: "src",
            },
            {
              content: "name",
              sel: "p.title",
              type: "text",
            },
            {
              content: "nmSub",
              sel: "p.usp.shorten-long-text",
              type: "text",
            },
            {
              content: "price",
              sel: "span[property=priceblock_el]",
              type: "text",
            },
          ],
        },
      },
      // {
      //   sel: "div.offerList",
      //   productCntSel: ["span.article-count"],
      //   product: {
      //     sel: "div.offerList a.offerList-itemWrapper",
      //     type: "link",
      //     details: [
      //       {
      //         content: "image",
      //         sel: "img",
      //         type: "src",
      //       },
      //       {
      //         content: "name",
      //         sel: "div.offerList-item-description-title",
      //         type: "text",
      //       },
      //       {
      //         content: "description",
      //         sel: "span.description-part-one",
      //         type: "text",
      //       },
      //       {
      //         content: "price",
      //         sel: "div.offerList-item-priceMin",
      //         type: "text",
      //       },
      //     ],
      //   },
      // },
    ],
  },
  "kaufland.de": {
    manualCategories: [
      {
        name: "B-Ware",
        link: "https://www.kaufland.de/shops/kaufland_b-ware",
      },
      {
        name: "Restposten",
        link: "https://www.kaufland.de/campaigns/2019/kw_18/kw18_restposten",
      },
    ],
    resourceTypes: {
      crawl: [
        "media",
        "font",
        "stylesheet",
        "ping",
        "image",
        "xhr",
        "fetch",
        "imageset",
        "sub_frame",
        "script",
        "other",
      ],
    },
    waitUntil: { product: "domcontentloaded", entryPoint: "domcontentloaded" },
    queryUrlSchema: [],
    d: "kaufland.de",
    mimic: "span.svg-logo.rh-main__logo-normal svg",
    purlschema: "",
    action: [],
    entryPoints: [
      {
        url: "https://www.kaufland.de",
        category: "default",
      },
    ],
    crawlActions: [],
    queryActions: [],
    categories: {
      exclude: ["ratgeber"],
      sel: "a.rh-menu-overlay__category",
      type: "href",
      subCategories: [
        {
          sel: "a:is(.rd-link.rd-tile,.btn.-primary)",
          type: "href",
        },
      ],
    },
    paginationEl: [
      {
        type: "pagination",
        scriptPagination: {
          regexp: "",
        },
        initialUrl: {
          regexp: "\\\\u002Fcategory\\\\u002F\\d+\\\\u002F",
          type: "encoded",
        },
        sel: "nav.rd-pagination",
        nav: "p",
        scrollToBottom: true,
        calculation: {
          method: "estimate",
          productsPerPage: 35,
          last: "nav.rd-pagination button.rd-page",
          sel: "nav.rd-pagination button.rd-page",
        },
      },
    ],
    productList: [
      {
        sel: "div.results.results--list",
        productCntSel: ["strong.product-count__products"],
        product: {
          sel: "div.results.results--list a.product-link",
          type: "link",
          details: [
            {
              content: "image",
              sel: "source",
              type: "srcset",
            },
            {
              content: "name",
              sel: "div.product__title",
              type: "text",
            },
            {
              content: "price",
              sel: "div.price",
              type: "text",
            },
          ],
        },
      },
      {
        sel: "div.results.results--grid",
        productCntSel: ["strong.product-count__products"],
        product: {
          sel: "div.results.results--grid a.product-link",
          type: "link",
          details: [
            {
              content: "image",
              sel: "source",
              type: "srcset",
            },
            {
              content: "name",
              sel: "div.product__title",
              type: "text",
            },
            {
              content: "price",
              sel: "div.price",
              type: "text",
            },
          ],
        },
      },
    ],
  },
  "otto.de": {
    manualCategories: [],
    resourceTypes: {
      crawl: [
        "media",
        "font",
        "stylesheet",
        "ping",
        "image",
        "xhr",
        "fetch",
        "imageset",
        "sub_frame",
        "script",
        "other",
      ],
    },
    waitUntil: { product: "load", entryPoint: "load" },
    queryUrlSchema: [],
    d: "otto.de",
    mimic: "svg.pl_logo",
    purlschema: "Prod\\w*\\/\\d*",
    action: [],
    entryPoints: [
      {
        url: "https://www.otto.de",
        category: "default",
      },
    ],
    crawlActions: [],
    queryActions: [],
    categories: {
      exclude: ["marken"],
      sel: "a.nav_navi-elem",
      type: "href",
      subCategories: [
        {
          sel: "ul.nav_local-links a.ts-link",
          type: "href",
        },
      ],
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "ul.reptile_paging.reptile_paging--bottom",
        nav: "?l=gp&o=<page>",
        scrollToBottom: true,
        paginationUrlSchema: {
          replace: "attach_end",
          withQuery: false,
          calculation: {
            method: "offset",
            offset: 120,
          },
        },
        calculation: {
          method: "count",
          last: "ul.reptile_paging.reptile_paging--bottom button",
          sel: "ul.reptile_paging.reptile_paging--bottom button",
        },
      },
    ],
    productList: [
      {
        sel: "div.sr-resultList",
        productCntSel: ["span.reptile_tilelist__itemCount"],
        product: {
          sel: "div.sr-resultList div.sr-resultItemTile",
          type: "not_link",
          details: [
            {
              content: "link",
              sel: "div.sr-resultItemLink a",
              type: "href",
            },
            {
              content: "image",
              sel: "div.sr-resultItemTile__imageSection img.sr-resultItemTile__image",
              type: "src",
            },
            {
              content: "name",
              sel: "div.sr-productSummary__title",
              type: "text",
            },
            {
              content: "description",
              sel: "div.sr-productSummary__description",
              type: "text",
            },
            {
              content: "price",
              sel: "div.sr-detailedPriceInfo__price",
              type: "text",
            },
          ],
        },
      },
      {
        sel: "div.offerList",
        productCntSel: ["span.reptile_tilelist__itemCount"],
        product: {
          sel: "div.offerList a.offerList-itemWrapper",
          type: "link",
          details: [
            {
              content: "image",
              sel: "img",
              type: "src",
            },
            {
              content: "name",
              sel: "div.offerList-item-description-title",
              type: "text",
            },
            {
              content: "description",
              sel: "span.description-part-one",
              type: "text",
            },
            {
              content: "price",
              sel: "div.offerList-item-priceMin",
              type: "text",
            },
          ],
        },
      },
    ],
  },
  "voelkner.de": {
    manualCategories: [
      {
        name: "Computer & Büro",
        link: "https://www.voelkner.de/categories/13140/computer-buero.html",
      },
      {
        name: "Multimedia",
        link: "https://www.voelkner.de/categories/13141/multimedia.html",
      },
      {
        name: "Haus & Garten",
        link: "https://www.voelkner.de/categories/13146/haus-garten.html",
      },
      {
        name: "Beleuchtung",
        link: "https://www.voelkner.de/categories/13147/beleuchtung.html",
      },
      {
        name: "Stromversorgung",
        link: "https://www.voelkner.de/categories/13145/stromversorgung.html",
      },
      {
        name: "Auto & Navigation",
        link: "https://www.voelkner.de/categories/13144/auto-amp-navigation.html",
      },
      {
        name: "Werkstatt",
        link: "https://www.voelkner.de/categories/13148/werkstatt.html",
      },
      {
        name: "Bauelemente",
        link: "https://www.voelkner.de/categories/13149/bauelemente.html",
      },
      {
        name: "Freizeit & Hobby",
        link: "https://www.voelkner.de/categories/13150/freizeit-hobby.html",
      },
    ],
    resourceTypes: {
      crawl: [
        "media",
        "font",
        "stylesheet",
        "ping",
        "image",
        "xhr",
        "fetch",
        "imageset",
        "sub_frame",
        "script",
        "other",
      ],
    },
    pauseOnProductPage: {
      pause: true,
      min: 500,
      max: 800,
    },
    waitUntil: { product: "load", entryPoint: "load" },
    queryUrlSchema: [],
    d: "voelkner.de",
    mimic: "a.head__wrapper__group__button svg",
    purlschema: "Prod\\w*\\/\\d*",
    action: [],
    entryPoints: [
      {
        url: "https://www.voelkner.de",
        category: "default",
      },
    ],
    crawlActions: [],
    queryActions: [],
    categories: {
      exclude: ["#", "voelkner-finds"],
      sel: "li.js_load_subcategories a",
      type: "href",
      subCategories: [
        {
          sel: "div.grid_container div.category__box a",
          type: "href",
        },
      ],
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div[id=js_search_pagination_bottom]",
        nav: "?page=",
        scrollToBottom: true,
        calculation: {
          method: "match_text",
          textToMatch: "Weitere Produkte anzeigen",
          dynamic: true,
          last: "button.button--solid.js_load_results",
          sel: "button.button--solid.js_load_results",
        },
      },
    ],
    productList: [
      {
        sel: "div[id=js_search_listing_results]",
        productCntSel: ["span.reptile_tilelist__itemCount"],
        product: {
          sel: "div.search_results__result",
          type: "not_link",
          details: [
            {
              content: "link",
              sel: "a.product_row__pic",
              type: "href",
            },
            {
              content: "image",
              sel: "a.product_row__pic img",
              type: "src",
            },
            {
              content: "name",
              sel: "a.product__title",
              type: "text",
            },
            {
              content: "price",
              sel: "div.product__price__wrapper",
              type: "text",
            },
          ],
        },
      },
    ],
  },
  "amazon.de": {
    waitUntil: { product: "load", entryPoint: "load" },
    resourceTypes: {
      query: [
        "media",
        "font",
        "stylesheet",
        "ping",
        "other",
        "image",
        "xhr",
        "fetch",
        "imageset",
        "sub_frame",
        "script",
      ],
    },
    d: "amazon.de",
    entryPoints: [
      {
        url: "https://www.amazon.de/?language=de_DE",
        category: "default",
      },
    ],
    queryUrlSchema: [
      {
        baseUrl: `https://www.amazon.de/s?k=<query>&language=de_DE`,
        category: "default",
      },
    ],
    mimic: "a[id=nav-logo-sprites]",
    queryActions: [
      // {
      //   type: "input",
      //   sel: "input[id=twotabsearchtextbox]",
      //   wait: false,
      //   what: ["product"],
      // },
      // {
      //   type: "button",
      //   sel: "input[id=nav-search-submit-button]",
      //   action: "click",
      //   wait: false,
      // },
    ],
    paginationEl: [],
    productList: [
      {
        sel: "span[data-component-type=s-search-results]",
        type: "container",
        product: {
          sel: "div[data-component-type=s-search-result]",
          type: "container",
          details: [
            {
              content: "link",
              sel: "h2 a",
              type: "href",
            },
            {
              content: "image",
              sel: "img.s-image",
              type: "src",
            },
            {
              content: "prime",
              sel: "i.a-icon-prime",
              type: "exist",
            },
            {
              content: "name",
              sel: "h2 span",
              type: "text",
            },
            {
              content: "price",
              sel: "div[data-cy=secondary-offer-recipe] span.a-color-base",
              type: "text",
            },
            {
              content: "price",
              sel: "span.a-price span.a-offscreen",
              type: "text",
            },
          ],
        },
      },
    ],
  },
  "ebay.de": {
    waitUntil: { product: "load", entryPoint: "load" },
    resourceTypes: {
      query: [
        "media",
        "font",
        "stylesheet",
        "ping",
        "image",
        "other",
        "xhr",
        "fetch",
        "imageset",
        "sub_frame",
        "script",
      ],
    },
    d: "ebay.de",
    mimic: "a[id=gh-la]",
    queryUrlSchema: [
      {
        baseUrl: `https://www.ebay.de/sch/i.html?_nkw=<query>`,
        category: "default",
      },
    ],
    entryPoint: [{ url: "https://www.ebay.de", category: "default" }],
    queryActions: [],
    paginationEl: [],
    productList: [
      {
        sel: "ul.srp-results",
        type: "container",
        product: {
          sel: "ul.srp-results li.s-item",
          type: "container",
          details: [
            {
              content: "link",
              sel: "div.s-item__info a",
              type: "href",
            },
            {
              content: "image",
              sel: "div.s-item__image-wrapper img",
              type: "src",
            },
            {
              content: "name",
              sel: "div.s-item__title span[role=heading]",
              type: "text",
            },
            {
              content: "price",
              sel: "span.s-item__price",
              type: "text",
            },
          ],
        },
      },
    ],
  },
};

const updateShops = async (shops) => {
  return Promise.all(
    Object.entries(shops).map(async ([key, val]) => {
      return await insertShop(val);
    })
  );
};

updateShops(shops).then(() => {
  process.exit(0);
});
