import { inserShop } from "./mongo.js";

export const shops = {
  "idealo.de": {
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
    action: [
      {
        type: "shadowroot-button",
        sel: "aside[id=usercentrics-cmp-ui]",
        btn_sel: "button[id=deny]",
        action: "click",
        wait: false,
      },
    ],
    entryPoint: [
      {
        url: "https://www.idealo.de",
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
    limit: {
      mainCategory: 1,
      subCategory: 1,
      pages: 2,
    },
    categories: {
      exclude: ["flug", "flüge", "hotel"],
      sel: "div.TopCategoriesCarouselstyle__TopCategoriesTextCarousel-sc-5vawzj-1 a",
      type: "href",
      basepath: true,
      subCategories: {
        sel: "div.cn-categoryGrid div.cn-categoryGridItem a:has(div.cn-categoryGridItem__title)",
        type: "href",
      },
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div.sr-pagination__numbers",
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
          last: "div.sr-pagination__numbers a.sr-pageElement",
          sel: "div.sr-pagination__numbers a.sr-pageElement",
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
        sel: "div.sr-resultList",
        productCntSel: [
          "span.offerList-count",
          "span.sr-resultTitle__resultCount",
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
              content: "link",
              sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
              urls: {
                redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
                default:
                  "https://www.idealo.de/preisvergleich/OffersOfProduct/",
              },
              attr: "data-gtm-payload",
              key: "productId",
              redirect_regex: "/^[0-9a-f]{32}$/",
              type: "parse_json",
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
          "span.offerList-count",
          "span.sr-resultTitle__resultCount",
        ],
        product: {
          sel: "div.offerList a.offerList-itemWrapper",
          type: "link",
          details: [
            // {
            //   content: "link",
            //   sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
            //   urls: {
            //     redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
            //     default:
            //       "https://www.idealo.de/preisvergleich/OffersOfProduct/",
            //   },
            //   attr: "data-gtm-payload",
            //   key: "productId",
            //   redirect_regex: "/^[0-9a-f]{32}$/",
            //   type: "parse_json",
            // },
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
    entryPoint: [
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
      subCategories: {
        sel: "ul.is--level1 a.navigation--link",
        type: "href",
      },
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div.sr-pagination__numbers",
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
          last: "div.sr-pagination__numbers a.sr-pageElement",
          sel: "div.sr-pagination__numbers a.sr-pageElement",
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
              content: "link",
              sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
              urls: {
                redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
                default:
                  "https://www.idealo.de/preisvergleich/OffersOfProduct/",
              },
              attr: "data-gtm-payload",
              key: "productId",
              redirect_regex: "/^[0-9a-f]{32}$/",
              type: "parse_json",
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
            // {
            //   content: "link",
            //   sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
            //   urls: {
            //     redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
            //     default:
            //       "https://www.idealo.de/preisvergleich/OffersOfProduct/",
            //   },
            //   attr: "data-gtm-payload",
            //   key: "productId",
            //   redirect_regex: "/^[0-9a-f]{32}$/",
            //   type: "parse_json",
            // },
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
        "script",
        "other",
      ],
    },
    waitUntil: { product: "domcontentloaded", entryPoint: "domcontentloaded" },
    queryUrlSchema: [],
    d: "bergfreunde.de",
    mimic: "a[data-mapp-click='header.logo'] img",
    purlschema: "Prod\\w*\\/\\d*",
    action: [],
    entryPoint: [
      {
        url: "https://www.bergfreunde.de",
        category: "default",
      },
    ],
    crawlActions: [],
    queryActions: [],
    categories: {
      exclude: [],
      sel: "a.level-1-link",
      type: "href",
      subCategories: {
        sel: "div.list-box a.cat-title-link",
        type: "href",
      },
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div.sr-pagination__numbers",
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
          last: "div.sr-pagination__numbers a.sr-pageElement",
          sel: "div.sr-pagination__numbers a.sr-pageElement",
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
        sel: "div.sr-resultList",
        productCntSel: ["div.product-amount"],
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
              content: "link",
              sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
              urls: {
                redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
                default:
                  "https://www.idealo.de/preisvergleich/OffersOfProduct/",
              },
              attr: "data-gtm-payload",
              key: "productId",
              redirect_regex: "/^[0-9a-f]{32}$/",
              type: "parse_json",
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
        productCntSel: ["div.product-amount"],
        product: {
          sel: "div.offerList a.offerList-itemWrapper",
          type: "link",
          details: [
            // {
            //   content: "link",
            //   sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
            //   urls: {
            //     redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
            //     default:
            //       "https://www.idealo.de/preisvergleich/OffersOfProduct/",
            //   },
            //   attr: "data-gtm-payload",
            //   key: "productId",
            //   redirect_regex: "/^[0-9a-f]{32}$/",
            //   type: "parse_json",
            // },
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
    entryPoint: [
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
      subCategories: {
        sel: "div[data-section-type=SubCategoryFilter] li a",
        type: "href",
      },
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div.sr-pagination__numbers",
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
          last: "div.sr-pagination__numbers a.sr-pageElement",
          sel: "div.sr-pagination__numbers a.sr-pageElement",
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
              content: "link",
              sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
              urls: {
                redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
                default:
                  "https://www.idealo.de/preisvergleich/OffersOfProduct/",
              },
              attr: "data-gtm-payload",
              key: "productId",
              redirect_regex: "/^[0-9a-f]{32}$/",
              type: "parse_json",
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
            // {
            //   content: "link",
            //   sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
            //   urls: {
            //     redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
            //     default:
            //       "https://www.idealo.de/preisvergleich/OffersOfProduct/",
            //   },
            //   attr: "data-gtm-payload",
            //   key: "productId",
            //   redirect_regex: "/^[0-9a-f]{32}$/",
            //   type: "parse_json",
            // },
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
    entryPoint: [
      {
        url: "https://www.costway.de",
        category: "default",
      },
    ],
    crawlActions: [],
    queryActions: [],
    categories: {
      exclude: [],
      sel: "a.top-nav",
      type: "href",
      subCategories: {
        sel: "div.catalog-sub-menu div.ant-col a",
        type: "href",
      },
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div.sr-pagination__numbers",
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
          last: "div.sr-pagination__numbers a.sr-pageElement",
          sel: "div.sr-pagination__numbers a.sr-pageElement",
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
        sel: "div.sr-resultList",
        productsPerPage: 24,
        productCntSel: [
          "ul.items.pages-items li:not(.page-item-next):nth-last-child(2)",
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
              content: "link",
              sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
              urls: {
                redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
                default:
                  "https://www.idealo.de/preisvergleich/OffersOfProduct/",
              },
              attr: "data-gtm-payload",
              key: "productId",
              redirect_regex: "/^[0-9a-f]{32}$/",
              type: "parse_json",
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
        productsPerPage: 24,
        productCntSel: [
          "ul.items.pages-items li:not(.page-item-next):nth-last-child(2)",
        ],
        product: {
          sel: "div.offerList a.offerList-itemWrapper",
          type: "link",
          details: [
            // {
            //   content: "link",
            //   sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
            //   urls: {
            //     redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
            //     default:
            //       "https://www.idealo.de/preisvergleich/OffersOfProduct/",
            //   },
            //   attr: "data-gtm-payload",
            //   key: "productId",
            //   redirect_regex: "/^[0-9a-f]{32}$/",
            //   type: "parse_json",
            // },
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
    waitUntil: { product: "domcontentloaded", entryPoint: "domcontentloaded" },
    queryUrlSchema: [
      {
        baseUrl: `https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=<query>`,
        category: "default",
      },
    ],
    d: "cyberport.de",
    mimic: "svg.cpHeaderLogo__svg",
    purlschema: "Prod\\w*\\/\\d*",
    action: [
      
    ],
    entryPoint: [
      {
        url: "https://www.cyberport.de",
        category: "default",
      },
    ],
    crawlActions: [],
    queryActions: [
      
    ],
    
    categories: {
      exclude: ['service-garantien','content-creator','nfl.html','lexikon','newsletter','digitales-lernen','kaufberatung','zurueck','zurück','stores', 'kontakt', 'einstellungen', 'tipps zum stöbern', 'newsletter', 'outlet'],
      sel: "#top > header > div.mainNavigation > div > div:nth-child(1) > div > div > nav > ul > li.nav-main-primary.nav-main-md-plus-devices > ul > li > a",
      type: "href",
      basepath: true,
      subCategories: {
        sel: "li:is(.levelFirst,.levelSecond) a",
        type: "href",
      },
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div.sr-pagination__numbers",
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
          last: "div.sr-pagination__numbers a.sr-pageElement",
          sel: "div.sr-pagination__numbers a.sr-pageElement",
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
        sel: "div.sr-resultList",
        productCntSel: [
          "span.resultCount"
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
              content: "link",
              sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
              urls: {
                redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
                default:
                  "https://www.idealo.de/preisvergleich/OffersOfProduct/",
              },
              attr: "data-gtm-payload",
              key: "productId",
              redirect_regex: "/^[0-9a-f]{32}$/",
              type: "parse_json",
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
          "span.resultCount"
        ],
        product: {
          sel: "div.offerList a.offerList-itemWrapper",
          type: "link",
          details: [
            // {
            //   content: "link",
            //   sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
            //   urls: {
            //     redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
            //     default:
            //       "https://www.idealo.de/preisvergleich/OffersOfProduct/",
            //   },
            //   attr: "data-gtm-payload",
            //   key: "productId",
            //   redirect_regex: "/^[0-9a-f]{32}$/",
            //   type: "parse_json",
            // },
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
  "dm.de": {
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
    },
    waitUntil: { product: "domcontentloaded", entryPoint: "domcontentloaded" },
    queryUrlSchema: [
      {
        baseUrl: `https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=<query>`,
        category: "default",
      },
    ],
    d: "dm.de",
    mimic: "svg.i-header-logo-image",
    purlschema: "Prod\\w*\\/\\d*",
    action: [
      {
        type: "shadowroot-button",
        sel: "aside[id=usercentrics-cmp-ui]",
        btn_sel: "button[id=deny]",
        action: "click",
        wait: false,
      },
    ],
    entryPoint: [
      {
        url: "https://www.idealo.de",
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
    limit: {
      mainCategory: 1,
      subCategory: 1,
      pages: 2,
    },
    categories: {
      exclude: ["flug", "flüge", "hotel"],
      sel: "div.TopCategoriesCarouselstyle__TopCategoriesTextCarousel-sc-5vawzj-1 a",
      type: "href",
      basepath: true,
      subCategories: {
        sel: "div.cn-categoryGrid div.cn-categoryGridItem a:has(div.cn-categoryGridItem__title)",
        type: "href",
      },
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div.sr-pagination__numbers",
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
          last: "div.sr-pagination__numbers a.sr-pageElement",
          sel: "div.sr-pagination__numbers a.sr-pageElement",
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
        sel: "div.sr-resultList",
        productCntSel: [
          "span.offerList-count",
          "span.sr-resultTitle__resultCount",
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
              content: "link",
              sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
              urls: {
                redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
                default:
                  "https://www.idealo.de/preisvergleich/OffersOfProduct/",
              },
              attr: "data-gtm-payload",
              key: "productId",
              redirect_regex: "/^[0-9a-f]{32}$/",
              type: "parse_json",
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
          "span.offerList-count",
          "span.sr-resultTitle__resultCount",
        ],
        product: {
          sel: "div.offerList a.offerList-itemWrapper",
          type: "link",
          details: [
            // {
            //   content: "link",
            //   sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
            //   urls: {
            //     redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
            //     default:
            //       "https://www.idealo.de/preisvergleich/OffersOfProduct/",
            //   },
            //   attr: "data-gtm-payload",
            //   key: "productId",
            //   redirect_regex: "/^[0-9a-f]{32}$/",
            //   type: "parse_json",
            // },
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
    },
    waitUntil: { product: "domcontentloaded", entryPoint: "domcontentloaded" },
    queryUrlSchema: [
      {
        baseUrl: `https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=<query>`,
        category: "default",
      },
    ],
    d: "fahrrad.de",
    mimic: "svg.i-header-logo-image",
    purlschema: "Prod\\w*\\/\\d*",
    action: [
      {
        type: "shadowroot-button",
        sel: "aside[id=usercentrics-cmp-ui]",
        btn_sel: "button[id=deny]",
        action: "click",
        wait: false,
      },
    ],
    entryPoint: [
      {
        url: "https://www.idealo.de",
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
    limit: {
      mainCategory: 1,
      subCategory: 1,
      pages: 2,
    },
    categories: {
      exclude: ["flug", "flüge", "hotel"],
      sel: "div.TopCategoriesCarouselstyle__TopCategoriesTextCarousel-sc-5vawzj-1 a",
      type: "href",
      basepath: true,
      subCategories: {
        sel: "div.cn-categoryGrid div.cn-categoryGridItem a:has(div.cn-categoryGridItem__title)",
        type: "href",
      },
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div.sr-pagination__numbers",
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
          last: "div.sr-pagination__numbers a.sr-pageElement",
          sel: "div.sr-pagination__numbers a.sr-pageElement",
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
        sel: "div.sr-resultList",
        productCntSel: [
          "span.offerList-count",
          "span.sr-resultTitle__resultCount",
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
              content: "link",
              sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
              urls: {
                redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
                default:
                  "https://www.idealo.de/preisvergleich/OffersOfProduct/",
              },
              attr: "data-gtm-payload",
              key: "productId",
              redirect_regex: "/^[0-9a-f]{32}$/",
              type: "parse_json",
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
          "span.offerList-count",
          "span.sr-resultTitle__resultCount",
        ],
        product: {
          sel: "div.offerList a.offerList-itemWrapper",
          type: "link",
          details: [
            // {
            //   content: "link",
            //   sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
            //   urls: {
            //     redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
            //     default:
            //       "https://www.idealo.de/preisvergleich/OffersOfProduct/",
            //   },
            //   attr: "data-gtm-payload",
            //   key: "productId",
            //   redirect_regex: "/^[0-9a-f]{32}$/",
            //   type: "parse_json",
            // },
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
    },
    waitUntil: { product: "domcontentloaded", entryPoint: "domcontentloaded" },
    queryUrlSchema: [
      {
        baseUrl: `https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=<query>`,
        category: "default",
      },
    ],
    d: "fressnapf.de",
    mimic: "svg.i-header-logo-image",
    purlschema: "Prod\\w*\\/\\d*",
    action: [
      {
        type: "shadowroot-button",
        sel: "aside[id=usercentrics-cmp-ui]",
        btn_sel: "button[id=deny]",
        action: "click",
        wait: false,
      },
    ],
    entryPoint: [
      {
        url: "https://www.idealo.de",
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
    limit: {
      mainCategory: 1,
      subCategory: 1,
      pages: 2,
    },
    categories: {
      exclude: ["flug", "flüge", "hotel"],
      sel: "div.TopCategoriesCarouselstyle__TopCategoriesTextCarousel-sc-5vawzj-1 a",
      type: "href",
      basepath: true,
      subCategories: {
        sel: "div.cn-categoryGrid div.cn-categoryGridItem a:has(div.cn-categoryGridItem__title)",
        type: "href",
      },
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div.sr-pagination__numbers",
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
          last: "div.sr-pagination__numbers a.sr-pageElement",
          sel: "div.sr-pagination__numbers a.sr-pageElement",
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
        sel: "div.sr-resultList",
        productCntSel: [
          "span.offerList-count",
          "span.sr-resultTitle__resultCount",
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
              content: "link",
              sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
              urls: {
                redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
                default:
                  "https://www.idealo.de/preisvergleich/OffersOfProduct/",
              },
              attr: "data-gtm-payload",
              key: "productId",
              redirect_regex: "/^[0-9a-f]{32}$/",
              type: "parse_json",
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
          "span.offerList-count",
          "span.sr-resultTitle__resultCount",
        ],
        product: {
          sel: "div.offerList a.offerList-itemWrapper",
          type: "link",
          details: [
            // {
            //   content: "link",
            //   sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
            //   urls: {
            //     redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
            //     default:
            //       "https://www.idealo.de/preisvergleich/OffersOfProduct/",
            //   },
            //   attr: "data-gtm-payload",
            //   key: "productId",
            //   redirect_regex: "/^[0-9a-f]{32}$/",
            //   type: "parse_json",
            // },
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
  "mindfactory.de": {
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
    },
    waitUntil: { product: "domcontentloaded", entryPoint: "domcontentloaded" },
    queryUrlSchema: [
      {
        baseUrl: `https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=<query>`,
        category: "default",
      },
    ],
    d: "mindfactory.de",
    mimic: "svg.i-header-logo-image",
    purlschema: "Prod\\w*\\/\\d*",
    action: [
      {
        type: "shadowroot-button",
        sel: "aside[id=usercentrics-cmp-ui]",
        btn_sel: "button[id=deny]",
        action: "click",
        wait: false,
      },
    ],
    entryPoint: [
      {
        url: "https://www.idealo.de",
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
    limit: {
      mainCategory: 1,
      subCategory: 1,
      pages: 2,
    },
    categories: {
      exclude: ["flug", "flüge", "hotel"],
      sel: "div.TopCategoriesCarouselstyle__TopCategoriesTextCarousel-sc-5vawzj-1 a",
      type: "href",
      basepath: true,
      subCategories: {
        sel: "div.cn-categoryGrid div.cn-categoryGridItem a:has(div.cn-categoryGridItem__title)",
        type: "href",
      },
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div.sr-pagination__numbers",
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
          last: "div.sr-pagination__numbers a.sr-pageElement",
          sel: "div.sr-pagination__numbers a.sr-pageElement",
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
        sel: "div.sr-resultList",
        productCntSel: [
          "span.offerList-count",
          "span.sr-resultTitle__resultCount",
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
              content: "link",
              sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
              urls: {
                redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
                default:
                  "https://www.idealo.de/preisvergleich/OffersOfProduct/",
              },
              attr: "data-gtm-payload",
              key: "productId",
              redirect_regex: "/^[0-9a-f]{32}$/",
              type: "parse_json",
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
          "span.offerList-count",
          "span.sr-resultTitle__resultCount",
        ],
        product: {
          sel: "div.offerList a.offerList-itemWrapper",
          type: "link",
          details: [
            // {
            //   content: "link",
            //   sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
            //   urls: {
            //     redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
            //     default:
            //       "https://www.idealo.de/preisvergleich/OffersOfProduct/",
            //   },
            //   attr: "data-gtm-payload",
            //   key: "productId",
            //   redirect_regex: "/^[0-9a-f]{32}$/",
            //   type: "parse_json",
            // },
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
    },
    waitUntil: { product: "domcontentloaded", entryPoint: "domcontentloaded" },
    queryUrlSchema: [
      {
        baseUrl: `https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=<query>`,
        category: "default",
      },
    ],
    d: "mueller.de",
    mimic: "svg.i-header-logo-image",
    purlschema: "Prod\\w*\\/\\d*",
    action: [
      {
        type: "shadowroot-button",
        sel: "aside[id=usercentrics-cmp-ui]",
        btn_sel: "button[id=deny]",
        action: "click",
        wait: false,
      },
    ],
    entryPoint: [
      {
        url: "https://www.idealo.de",
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
    limit: {
      mainCategory: 1,
      subCategory: 1,
      pages: 2,
    },
    categories: {
      exclude: ["flug", "flüge", "hotel"],
      sel: "div.TopCategoriesCarouselstyle__TopCategoriesTextCarousel-sc-5vawzj-1 a",
      type: "href",
      basepath: true,
      subCategories: {
        sel: "div.cn-categoryGrid div.cn-categoryGridItem a:has(div.cn-categoryGridItem__title)",
        type: "href",
      },
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div.sr-pagination__numbers",
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
          last: "div.sr-pagination__numbers a.sr-pageElement",
          sel: "div.sr-pagination__numbers a.sr-pageElement",
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
        sel: "div.sr-resultList",
        productCntSel: [
          "span.offerList-count",
          "span.sr-resultTitle__resultCount",
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
              content: "link",
              sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
              urls: {
                redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
                default:
                  "https://www.idealo.de/preisvergleich/OffersOfProduct/",
              },
              attr: "data-gtm-payload",
              key: "productId",
              redirect_regex: "/^[0-9a-f]{32}$/",
              type: "parse_json",
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
          "span.offerList-count",
          "span.sr-resultTitle__resultCount",
        ],
        product: {
          sel: "div.offerList a.offerList-itemWrapper",
          type: "link",
          details: [
            // {
            //   content: "link",
            //   sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
            //   urls: {
            //     redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
            //     default:
            //       "https://www.idealo.de/preisvergleich/OffersOfProduct/",
            //   },
            //   attr: "data-gtm-payload",
            //   key: "productId",
            //   redirect_regex: "/^[0-9a-f]{32}$/",
            //   type: "parse_json",
            // },
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
  "quelle.de": {
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
    },
    waitUntil: { product: "domcontentloaded", entryPoint: "domcontentloaded" },
    queryUrlSchema: [
      {
        baseUrl: `https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=<query>`,
        category: "default",
      },
    ],
    d: "quelle.de",
    mimic: "svg.i-header-logo-image",
    purlschema: "Prod\\w*\\/\\d*",
    action: [
      {
        type: "shadowroot-button",
        sel: "aside[id=usercentrics-cmp-ui]",
        btn_sel: "button[id=deny]",
        action: "click",
        wait: false,
      },
    ],
    entryPoint: [
      {
        url: "https://www.idealo.de",
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
    limit: {
      mainCategory: 1,
      subCategory: 1,
      pages: 2,
    },
    categories: {
      exclude: ["flug", "flüge", "hotel"],
      sel: "div.TopCategoriesCarouselstyle__TopCategoriesTextCarousel-sc-5vawzj-1 a",
      type: "href",
      basepath: true,
      subCategories: {
        sel: "div.cn-categoryGrid div.cn-categoryGridItem a:has(div.cn-categoryGridItem__title)",
        type: "href",
      },
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div.sr-pagination__numbers",
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
          last: "div.sr-pagination__numbers a.sr-pageElement",
          sel: "div.sr-pagination__numbers a.sr-pageElement",
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
        sel: "div.sr-resultList",
        productCntSel: [
          "span.offerList-count",
          "span.sr-resultTitle__resultCount",
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
              content: "link",
              sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
              urls: {
                redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
                default:
                  "https://www.idealo.de/preisvergleich/OffersOfProduct/",
              },
              attr: "data-gtm-payload",
              key: "productId",
              redirect_regex: "/^[0-9a-f]{32}$/",
              type: "parse_json",
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
          "span.offerList-count",
          "span.sr-resultTitle__resultCount",
        ],
        product: {
          sel: "div.offerList a.offerList-itemWrapper",
          type: "link",
          details: [
            // {
            //   content: "link",
            //   sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
            //   urls: {
            //     redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
            //     default:
            //       "https://www.idealo.de/preisvergleich/OffersOfProduct/",
            //   },
            //   attr: "data-gtm-payload",
            //   key: "productId",
            //   redirect_regex: "/^[0-9a-f]{32}$/",
            //   type: "parse_json",
            // },
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
    },
    waitUntil: { product: "domcontentloaded", entryPoint: "domcontentloaded" },
    queryUrlSchema: [
      {
        baseUrl: `https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=<query>`,
        category: "default",
      },
    ],
    d: "reichelt.de",
    mimic: "svg.i-header-logo-image",
    purlschema: "Prod\\w*\\/\\d*",
    action: [
      {
        type: "shadowroot-button",
        sel: "aside[id=usercentrics-cmp-ui]",
        btn_sel: "button[id=deny]",
        action: "click",
        wait: false,
      },
    ],
    entryPoint: [
      {
        url: "https://www.idealo.de",
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
    limit: {
      mainCategory: 1,
      subCategory: 1,
      pages: 2,
    },
    categories: {
      exclude: ["flug", "flüge", "hotel"],
      sel: "div.TopCategoriesCarouselstyle__TopCategoriesTextCarousel-sc-5vawzj-1 a",
      type: "href",
      basepath: true,
      subCategories: {
        sel: "div.cn-categoryGrid div.cn-categoryGridItem a:has(div.cn-categoryGridItem__title)",
        type: "href",
      },
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div.sr-pagination__numbers",
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
          last: "div.sr-pagination__numbers a.sr-pageElement",
          sel: "div.sr-pagination__numbers a.sr-pageElement",
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
        sel: "div.sr-resultList",
        productCntSel: [
          "span.offerList-count",
          "span.sr-resultTitle__resultCount",
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
              content: "link",
              sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
              urls: {
                redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
                default:
                  "https://www.idealo.de/preisvergleich/OffersOfProduct/",
              },
              attr: "data-gtm-payload",
              key: "productId",
              redirect_regex: "/^[0-9a-f]{32}$/",
              type: "parse_json",
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
          "span.offerList-count",
          "span.sr-resultTitle__resultCount",
        ],
        product: {
          sel: "div.offerList a.offerList-itemWrapper",
          type: "link",
          details: [
            // {
            //   content: "link",
            //   sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
            //   urls: {
            //     redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
            //     default:
            //       "https://www.idealo.de/preisvergleich/OffersOfProduct/",
            //   },
            //   attr: "data-gtm-payload",
            //   key: "productId",
            //   redirect_regex: "/^[0-9a-f]{32}$/",
            //   type: "parse_json",
            // },
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
  "saturn.de": {
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
    },
    waitUntil: { product: "domcontentloaded", entryPoint: "domcontentloaded" },
    queryUrlSchema: [
      {
        baseUrl: `https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=<query>`,
        category: "default",
      },
    ],
    d: "saturn.de",
    mimic: "svg.i-header-logo-image",
    purlschema: "Prod\\w*\\/\\d*",
    action: [
      {
        type: "shadowroot-button",
        sel: "aside[id=usercentrics-cmp-ui]",
        btn_sel: "button[id=deny]",
        action: "click",
        wait: false,
      },
    ],
    entryPoint: [
      {
        url: "https://www.idealo.de",
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
    limit: {
      mainCategory: 1,
      subCategory: 1,
      pages: 2,
    },
    categories: {
      exclude: ["flug", "flüge", "hotel"],
      sel: "div.TopCategoriesCarouselstyle__TopCategoriesTextCarousel-sc-5vawzj-1 a",
      type: "href",
      basepath: true,
      subCategories: {
        sel: "div.cn-categoryGrid div.cn-categoryGridItem a:has(div.cn-categoryGridItem__title)",
        type: "href",
      },
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div.sr-pagination__numbers",
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
          last: "div.sr-pagination__numbers a.sr-pageElement",
          sel: "div.sr-pagination__numbers a.sr-pageElement",
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
        sel: "div.sr-resultList",
        productCntSel: [
          "span.offerList-count",
          "span.sr-resultTitle__resultCount",
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
              content: "link",
              sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
              urls: {
                redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
                default:
                  "https://www.idealo.de/preisvergleich/OffersOfProduct/",
              },
              attr: "data-gtm-payload",
              key: "productId",
              redirect_regex: "/^[0-9a-f]{32}$/",
              type: "parse_json",
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
          "span.offerList-count",
          "span.sr-resultTitle__resultCount",
        ],
        product: {
          sel: "div.offerList a.offerList-itemWrapper",
          type: "link",
          details: [
            // {
            //   content: "link",
            //   sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
            //   urls: {
            //     redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
            //     default:
            //       "https://www.idealo.de/preisvergleich/OffersOfProduct/",
            //   },
            //   attr: "data-gtm-payload",
            //   key: "productId",
            //   redirect_regex: "/^[0-9a-f]{32}$/",
            //   type: "parse_json",
            // },
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
    },
    waitUntil: { product: "domcontentloaded", entryPoint: "domcontentloaded" },
    queryUrlSchema: [
      {
        baseUrl: `https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=<query>`,
        category: "default",
      },
    ],
    d: "sportspar.de",
    mimic: "svg.i-header-logo-image",
    purlschema: "Prod\\w*\\/\\d*",
    action: [
      {
        type: "shadowroot-button",
        sel: "aside[id=usercentrics-cmp-ui]",
        btn_sel: "button[id=deny]",
        action: "click",
        wait: false,
      },
    ],
    entryPoint: [
      {
        url: "https://www.idealo.de",
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
    limit: {
      mainCategory: 1,
      subCategory: 1,
      pages: 2,
    },
    categories: {
      exclude: ["flug", "flüge", "hotel"],
      sel: "div.TopCategoriesCarouselstyle__TopCategoriesTextCarousel-sc-5vawzj-1 a",
      type: "href",
      basepath: true,
      subCategories: {
        sel: "div.cn-categoryGrid div.cn-categoryGridItem a:has(div.cn-categoryGridItem__title)",
        type: "href",
      },
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div.sr-pagination__numbers",
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
          last: "div.sr-pagination__numbers a.sr-pageElement",
          sel: "div.sr-pagination__numbers a.sr-pageElement",
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
        sel: "div.sr-resultList",
        productCntSel: [
          "span.offerList-count",
          "span.sr-resultTitle__resultCount",
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
              content: "link",
              sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
              urls: {
                redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
                default:
                  "https://www.idealo.de/preisvergleich/OffersOfProduct/",
              },
              attr: "data-gtm-payload",
              key: "productId",
              redirect_regex: "/^[0-9a-f]{32}$/",
              type: "parse_json",
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
          "span.offerList-count",
          "span.sr-resultTitle__resultCount",
        ],
        product: {
          sel: "div.offerList a.offerList-itemWrapper",
          type: "link",
          details: [
            // {
            //   content: "link",
            //   sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
            //   urls: {
            //     redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
            //     default:
            //       "https://www.idealo.de/preisvergleich/OffersOfProduct/",
            //   },
            //   attr: "data-gtm-payload",
            //   key: "productId",
            //   redirect_regex: "/^[0-9a-f]{32}$/",
            //   type: "parse_json",
            // },
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
    },
    waitUntil: { product: "domcontentloaded", entryPoint: "domcontentloaded" },
    queryUrlSchema: [
      {
        baseUrl: `https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=<query>`,
        category: "default",
      },
    ],
    d: "weltbild.de",
    mimic: "svg.i-header-logo-image",
    purlschema: "Prod\\w*\\/\\d*",
    action: [
      {
        type: "shadowroot-button",
        sel: "aside[id=usercentrics-cmp-ui]",
        btn_sel: "button[id=deny]",
        action: "click",
        wait: false,
      },
    ],
    entryPoint: [
      {
        url: "https://www.idealo.de",
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
    limit: {
      mainCategory: 1,
      subCategory: 1,
      pages: 2,
    },
    categories: {
      exclude: ["flug", "flüge", "hotel"],
      sel: "div.TopCategoriesCarouselstyle__TopCategoriesTextCarousel-sc-5vawzj-1 a",
      type: "href",
      basepath: true,
      subCategories: {
        sel: "div.cn-categoryGrid div.cn-categoryGridItem a:has(div.cn-categoryGridItem__title)",
        type: "href",
      },
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div.sr-pagination__numbers",
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
          last: "div.sr-pagination__numbers a.sr-pageElement",
          sel: "div.sr-pagination__numbers a.sr-pageElement",
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
        sel: "div.sr-resultList",
        productCntSel: [
          "span.offerList-count",
          "span.sr-resultTitle__resultCount",
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
              content: "link",
              sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
              urls: {
                redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
                default:
                  "https://www.idealo.de/preisvergleich/OffersOfProduct/",
              },
              attr: "data-gtm-payload",
              key: "productId",
              redirect_regex: "/^[0-9a-f]{32}$/",
              type: "parse_json",
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
          "span.offerList-count",
          "span.sr-resultTitle__resultCount",
        ],
        product: {
          sel: "div.offerList a.offerList-itemWrapper",
          type: "link",
          details: [
            // {
            //   content: "link",
            //   sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
            //   urls: {
            //     redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
            //     default:
            //       "https://www.idealo.de/preisvergleich/OffersOfProduct/",
            //   },
            //   attr: "data-gtm-payload",
            //   key: "productId",
            //   redirect_regex: "/^[0-9a-f]{32}$/",
            //   type: "parse_json",
            // },
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
  "otto.de": {
    manualCategories: [],
    resourceTypes: {
      crawl: [
        "media",
        "font",
        // "stylesheet",
        "ping",
        "image",
        "xhr",
        "other",
        "fetch",
        "imageset",
        "script",
        "sub_frame",
      ],
    },
    waitUntil: { product: "domcontentloaded", entryPoint: "networkidle2" },
    queryUrlSchema: [],
    d: "otto.de",
    mimic: "svg.pl_logo",
    purlschema: "Prod\\w*\\/\\d*",
    action: [],
    entryPoint: [
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
      basepath: false,
      subCategories: {
        sel: "ul.nav_local-links a.ts-link",
        type: "href",
      },
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div.sr-pagination__numbers",
        nav: "I16-<page>.html",
        scrollToBottom: true,
        paginationUrlSchema: {
          replace: ".html",
          withQuery: false,
          calculation: {
            method: "offset",
            offset: 15,
          },
        },
        calculation: {
          method: "count",
          last: "div.sr-pagination__numbers a.sr-pageElement",
          sel: "div.sr-pagination__numbers a.sr-pageElement",
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
              content: "link",
              sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
              urls: {
                redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
                default:
                  "https://www.idealo.de/preisvergleich/OffersOfProduct/",
              },
              attr: "data-gtm-payload",
              key: "productId",
              redirect_regex: "/^[0-9a-f]{32}$/",
              type: "parse_json",
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
            // {
            //   content: "link",
            //   sel: 'button[data-gtm-payload*="{"][data-gtm-event="productlist.click"]',
            //   urls: {
            //     redirect: "https://www.idealo.de/relocator/relocate?offerKey=",
            //     default:
            //       "https://www.idealo.de/preisvergleich/OffersOfProduct/",
            //   },
            //   attr: "data-gtm-payload",
            //   key: "productId",
            //   redirect_regex: "/^[0-9a-f]{32}$/",
            //   type: "parse_json",
            // },
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
  "alternate.de": {
    waitUntil: { product: "domcontentloaded", entryPoint: "domcontentloaded" },
    entryPoint: "https://www.alternate.de",
    d: "alternate.de",
    queryActions: [],
    categories: {
      sel: "div[id=navigation-tree] a",
      type: "href",
      basepath: false,
      subCategories: {
        sel: "div[id=category] div.accordion a.font-weight-bold",
        type: "href",
      },
    },
    paginationEl: {
      type: "pagination",
      sel: "div.d-flex.justify-content-center.align-items-baseline",
      nav: "?page=",
      calculation: {
        method: "count",
        sel: "div.d-flex.justify-content-center.align-items-baseline a",
      },
    },
    productList: [
      {
        sel: "div[id=dailyDeals]",
        type: "container",
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
    ],
  },
  "amazon.de": {
    waitUntil: { product: "domcontentloaded", entryPoint: "domcontentloaded" },
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
    entryPoint: "https://www.amazon.de",
    queryUrlSchema: [
      {
        baseUrl: `https://www.amazon.de/s?k=<query>`,
        category: "default",
      },
    ],
    mimic: "a[id=nav-logo-sprites]",
    queryActions: [
      // {
      //   type: "input",
      //   sel: "input[id='twotabsearchtextbox']",
      //   what: ["product"],
      // },
      // {
      //   type: "button",
      //   sel: "input[id=nav-search-submit-button]",
      //   action: "click",
      //   wait: true,
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
    waitUntil: { product: "domcontentloaded", entryPoint: "domcontentloaded" },
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
    entryPoint: "https://www.ebay.de",
    queryActions: [
      // {
      //   type: "input",
      //   sel: "input[id=gh-ac]",
      //   what: ["product"],
      // },
      // {
      //   type: "button",
      //   sel: "input[id=gh-btn]",
      //   action: "click",
      //   wait: true,
      // },
    ],
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

const updateShops = (shops) => {
  Object.entries(shops).forEach(([key, val]) => {
    inserShop(val).then((res) => {
      console.log(res);
    });
  });
};

updateShops(shops);
