import { insertShop } from "./services/db/util/shops.js";

export const shops = {
  "idealo.de": {
    actions: [
      {
        type: "recursive-button",
        sel: "button.productOffers-listLoadMore",
        action: "click",
        waitDuration: 600,
        wait: false,
      },
    ],
    allowedHosts: ["cdn.idealo.com"],
    active: true,
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
    crawlActions: [
      {
        type: "button",
        sel: "a.productVariants-listItemWrapper",
        action: "click",
        wait: true,
      },
    ],
    d: "idealo.de",
    entryPoints: [
      {
        url: "https://www.idealo.de",
        category: "default",
      },
    ],
    exceptions: ["https://www.idealo.de/offerpage/offerlist/product/"],
    hasEan: true,
    manualCategories: [
      {
        name: "Sale",
        link: "https://www.idealo.de/preisvergleich/MainSearchProductCategory/100oE0oJ4.html",
      },
    ],
    mimic: "svg.i-header-logo-image",
    paginationEl: [
      {
        type: "pagination",
        sel: "div[class*=sr-pagination__numbers]",
        nav: "I16-<page>.html",
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
    pauseOnProductPage: {
      pause: true,
      min: 500,
      max: 800,
    },
    product: [
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "image",
        path: "image[0]",
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "price",
        path: "offers.lowPrice",
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "instock",
        path: "offers.availability",
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "ean",
        path: "gtin",
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "sku",
        path: "sku",
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
              sel: "div[id=offerList] li.productOffers-listItem",
              attr: "data-dl-click",
              key: "shop_name",
              type: "parse_object_property",
            },
            {
              content: "name",
              sel: "span.productOffers-listItemTitleInner",
              type: "text",
            },
            {
              content: "price",
              attr: "data-dl-click",
              key: "products[0].price",
              sel: "div[id=offerList] li.productOffers-listItem",
              type: "parse_object_property",
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
            // {
            //   content: "link",
            //   sel: 'span[role=button][data-wishlist-heart*="{"]',
            //   urls: {
            //     redirect:
            //       "https://www.idealo.de/relocator/relocate?offerKey=<key>&type=oc_offer",
            //     default:
            //       "https://www.idealo.de/preisvergleich/OffersOfProduct/",
            //   },
            //   attr: "data-wishlist-heart",
            //   key: "offerKey",
            //   redirect_regex: "^[0-9a-f]{32}$",
            //   type: "parse_json",
            // },
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
    proxyType: "mix",
    purlschema: "Prod\\w*\\/\\d*",
    queryActions: [],
    queryUrlSchema: [
      {
        baseUrl:
          "https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=<query>",
        category: "default",
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
        "imageset",
        "sub_frame",
        "other",
      ],
    },
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
    waitUntil: {
      product: "domcontentloaded",
      entryPoint: "domcontentloaded",
    },
  },
  "alternate.de": {
    action: [],
    active: true,
    categories: {
      exclude: ["generalüberholt"],
      sel: "div[id=navigation-tree] a",
      type: "href",
      basepath: false,
      subCategories: [
        {
          sel: "div[id=category] div.accordion a",
          type: "href",
        },
      ],
    },
    category: [],
    crawlActions: [],
    d: "alternate.de",
    entryPoints: [
      {
        url: "https://www.alternate.de",
        category: "default",
      },
    ],
    hasEan: true,
    manualCategories: [
      {
        name: "Tages Deals",
        link: "https://www.alternate.de/TagesDeals",
      },
    ],
    mimic: "img.header-logo",
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
    pauseOnProductPage: {
      pause: true,
      min: 500,
      max: 800,
    },
    product: [
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "cur",
        path: "offers.priceCurrency",
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "price",
        path: "offers.price",
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "instock",
        path: "offers.availability",
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "ean",
        path: ["gtin8", "[0].gtin8"],
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "sku",
        path: ["sku", "[0].sku"],
      },
      {
        sel: "div.nav-product-details table",
        head: "td.c1",
        row: "td.c4",
        type: "table",
        content: "ean",
      },
    ],
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
    purlschema: "/product/\\d+",
    proxyType: "mix",
    queryActions: [],
    queryUrlSchema: [],
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
    waitUntil: {
      product: "load",
      entryPoint: "load",
    },
  },
  "gamestop.de": {
    action: [],
    active: true,
    categories: {
      visible: false,
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
          visible: false,
        },
      ],
    },
    crawlActions: [],
    d: "gamestop.de",
    entryPoints: [
      {
        url: "https://www.gamestop.de",
        category: "default",
      },
    ],
    exceptions: [
      "https://www.gamestop.de/Content/Images/big-loader.gif",
      "https://www.gamestop.de/Views/Locale/Content/Images/medDefault.jpg",
      "https://www.gamestop.de/Views/Locale/Content/Images/maxDefault.jpg",
    ],
    hasEan: true,
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
    mimic: "input#closeContentKey",
    paginationEl: [
      {
        type: "pagination",
        sel: "button.button-secondary.loadmoreBtn",
        nav: "&typesorting=0&sdirection=ascending&skippos=<skip>&takenum=24",
        paginationUrlSchema: {
          withQuery: false,
          calculation: {
            method: "replace_append",
            replace: [
              {
                search: "<skip>",
                skip: 24,
                use: "skip",
              },
              {
                search: "QuickSearch",
                replace: "QuicksearchAjax",
              },
            ],
          },
        },
        calculation: {
          method: "product_count",
          productsPerPage: 24,
          textToMatch: "Weitere Artikel laden",
          dynamic: true,
          last: "button.button-secondary.loadmoreBtn",
          sel: "button.button-secondary.loadmoreBtn",
        },
      },
    ],
    pauseOnProductPage: {
      pause: true,
      min: 700,
      max: 800,
    },
    product: [
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "price",
        path: "[0].offers[0].price",
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "price",
        path: "offers[0].price",
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "instock",
        path: "offers[0].availability",
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "ean",
        path: "gtin13",
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "sku",
        path: "sku",
      },
    ],
    productList: [
      {
        sel: "div[id=productsList]",
        productCntSel: ["strong.searchSumCount"],
        product: {
          sel: "div[id=productsList] div[id*=product_]",
          type: "not_link",
          details: [
            {
              content: "link",
              sel: "div.searchProductImage a",
              type: "href",
            },
            {
              content: "image",
              sel: "div.searchProductImage img",
              type: "data-llsrc",
            },
            {
              content: "mnfctr",
              sel: "div[class*=SearchProductInfo] h4",
              type: "text",
            },
            {
              content: "name",
              sel: "h3.searchProductTitle a",
              type: "text",
            },
            {
              content: "description",
              sel: "div.sr-productSummary__description",
              type: "text",
            },
            {
              content: "price",
              sel: "div[class*=price-]",
              type: "text",
            },
          ],
        },
      },
      {
        sel: "div.prodList",
        productCntSel: ["strong.searchSumCount"],
        product: {
          sel: "div.prodList div[id*=product_]",
          type: "not_link",
          details: [
            {
              content: "link",
              sel: "div.searchProductImage a",
              type: "href",
            },
            {
              content: "image",
              sel: "div.searchProductImage img",
              type: "data-llsrc",
            },
            {
              content: "mnfctr",
              sel: "div[class*=SearchProductInfo] h4",
              type: "text",
            },
            {
              content: "name",
              sel: "h3.searchProductTitle a",
              type: "text",
            },
            {
              content: "description",
              sel: "div.sr-productSummary__description",
              type: "text",
            },
            {
              content: "price",
              sel: "div[class*=price-]",
              type: "text",
            },
          ],
        },
      },
    ],
    proxyType: "mix",
    purlschema: "Prod\\w*\\/\\d*",
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: ["media", "font", "image", "script", "stylesheet"],
    },
    waitUntil: {
      product: "domcontentloaded",
      entryPoint: "domcontentloaded",
    },
  },
  "alza.de": {
    action: [],
    active: true,
    allowedHosts: ["cdn.alza.cz", "1603811301.rsc.cdn77.org"],
    categories: {
      visible: false,
      exclude: ["wie-baue"],
      sel: "div.js-left-category-menu li a.l0-catLink",
      type: "href",
      subCategories: [
        {
          sel: "div.category-tiles__categories a.category-tiles__tile",
          type: "href",
          visible: false,
        },
        {
          sel: "div.react-category-tiles a",
          type: "href",
          visible: false,
        },
      ],
    },
    crawlActions: [],
    d: "alza.de",
    entryPoints: [
      {
        url: "https://www.alza.de",
        category: "default",
      },
    ],
    exceptions: ["https://cdn.alza.cz/Foto/ImgGalery/boxImgPlaceholder-f1.png"],
    hasEan: true,
    manualCategories: [],
    mimic: "a.header-alz-42 img",
    paginationEl: [
      {
        type: "pagination",
        sel: "div[id=pagerbottom]",
        nav: "#f&cst=null&cud=0&pg=",
        calculation: {
          method: "product_count",
          productsPerPage: 24,
          dynamic: true,
          last: "div[id=pagerbottom] a.pgn",
          sel: "div[id=pagerbottom] a.pgn",
        },
      },
    ],
    pauseOnProductPage: {
      pause: true,
      min: 700,
      max: 800,
    },
    product: [
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        parent: "div[id=content0c]",
        content: "price",
        regex: '"price":\\s*"(\\S+)"',
        path: "offers.price",
        multiple: true,
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        parent: "div[id=content0c]",
        multiple: true,
        regex: '"availability":\\s*"(\\S+)"',
        content: "instock",
        path: "offers.availability",
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "ean",
        parent: "div[id=content0c]",
        regex: '"gtin13":\\s*"(\\d+)"',
        multiple: true,
        path: "gtin13",
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "sku",
        regex: '"sku":\\s*"(\\S+)"',
        parent: "div[id=content0c]",
        multiple: true,
        path: "sku",
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "mku",
        regex: '"mku":\\s*"(\\S+)"',
        parent: "div[id=content0c]",
        multiple: true,
        path: "mpn",
      },
    ],
    productList: [
      {
        sel: "div[id=boxes]",
        productCntSel: ["div[id=lblNumberItem0] span.numberItem"],
        product: {
          sel: "div[id=boxes] div.browsingitem",
          type: "not_link",
          details: [
            {
              content: "link",
              sel: "a.pc.browsinglink",
              type: "href",
            },
            {
              content: "image",
              sel: "a.pc.browsinglink img",
              type: "srcset",
            },
            {
              content: "name",
              sel: "a.name.browsinglink",
              type: "text",
            },
            {
              content: "description",
              sel: "div.Description",
              type: "text",
            },
            {
              content: "price",
              sel: "span.price-box__price",
              type: "text",
            },
          ],
        },
      },
    ],
    proxyType: "mix",
    purlschema: "Prod\\w*\\/\\d*",
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: ["media", "font", "image"],
    },
    waitUntil: {
      product: "load",
      entryPoint: "load",
    },
  },
  "bergfreunde.de": {
    action: [],
    active: true,
    categories: {
      exclude: ["anzeigen"],
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
    crawlActions: [],
    d: "bergfreunde.de",
    entryPoints: [
      {
        url: "https://www.bergfreunde.de",
        category: "default",
      },
    ],
    exceptions: [
      "https://www.bergfreunde.de/out/pictures/img/bergfreunde-logo.png",
    ],
    hasEan: true,
    manualCategories: [],
    mimic: "a[data-mapp-click='header.logo'] img",
    paginationEl: [
      {
        type: "pagination",
        sel: "div.paging",
        nav: "/",
        calculation: {
          method: "count",
          last: "div.paging a",
          sel: "div.paging a",
        },
      },
    ],
    pauseOnProductPage: {
      pause: true,
      min: 500,
      max: 800,
    },
    product: [
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "price",
        multiple: true,
        parent: "div[id=details]",
        path: "offers.price",
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "instock",
        multiple: true,
        parent: "div[id=details]",
        path: "offers.availability",
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "ean",
        multiple: true,
        parent: "div[id=details]",
        path: "gtin13",
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "sku",
        multiple: true,
        parent: "div[id=details]",
        path: "sku",
      },
      {
        parent: "li[itemprop=associatedMedia]",
        sel: "img",
        type: "src",
        content: "image",
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
              sel: "div.product-price span[data-codecept=currentPrice]",
              type: "text",
            },
          ],
        },
      },
    ],
    proxyType: "mix",
    purlschema: "Prod\\w*\\/\\d*",
    queryActions: [],
    queryUrlSchema: [],
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
    waitUntil: {
      product: "load",
      entryPoint: "load",
    },
  },
  "cyberport.de": {
    action: [],
    active: true,
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
    crawlActions: [],
    d: "cyberport.de",
    entryPoints: [
      {
        url: "https://www.cyberport.de",
        category: "default",
      },
    ],
    hasEan: false,
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
    mimic: "svg.cpHeaderLogo__svg",
    paginationEl: [
      {
        type: "pagination",
        sel: "div.paging",
        nav: "?p=",
        calculation: {
          method: "count",
          last: "div.paging a",
          sel: "div.paging a",
        },
      },
    ],
    product: [
      {
        parent: "div.productOmnibox-availability__delivery",
        sel: 'a[href="#overlayDeliveryAvailability"]',
        type: "text",
        content: "instock",
      },
      {
        parent: "div.productOmnibox-price",
        sel: "span.productOmnibox-price__price--delivery",
        type: "text",
        content: "price",
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
    ],
    proxyType: "mix",
    purlschema: "Prod\\w*\\/\\d*",
    queryActions: [],
    queryUrlSchema: [],
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
    waitUntil: {
      product: "load",
      entryPoint: "load",
    },
  },
  "dm.de": {
    action: [],
    active: true,
    allowedHosts: [
      "product-search.services.dmtech.com",
      "assets.dm.de",
      "products.dm.de",
      "content.services.dmtech.com",
    ],
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
    crawlActions: [],
    d: "dm.de",
    ean: "p[0-9]{12,13}",
    entryPoints: [
      {
        url: "https://www.dm.de",
        category: "default",
      },
    ],
    hasEan: false,
    manualCategories: [],
    mimic: "svg[data-dmid=dm-brand]",
    paginationEl: [
      {
        type: "recursive-more-button",
        sel: "button[data-dmid=load-more-products-button]",
        nav: "?currentPage0=",
        wait: false,
        calculation: {
          method: "match_text",
          textToMatch: "Mehr laden",
          dynamic: true,
          last: "button[data-dmid=load-more-products-button]",
          sel: "button[data-dmid=load-more-products-button]",
        },
      },
    ],
    pauseOnProductPage: {
      pause: true,
      min: 800,
      max: 1000,
    },
    product: [
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "price",
        path: "offers.price",
        multiple: true,
        parent: "head",
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "instock",
        path: "offers.availability",
        multiple: true,
        parent: "head",
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "ean",
        path: "gtin",
        multiple: true,
        parent: "head",
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "sku",
        path: "sku",
        multiple: true,
        parent: "head",
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
    proxyType: "mix",
    purlschema: "Prod\\w*\\/\\d*",
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: [
        "media",
        "font",
        // "stylesheet",
        "ping",
        "image",
        // "fetch",
        "imageset",
        "sub_frame",
        "other",
      ],
    },
    waitUntil: {
      product: "load",
      entryPoint: "load",
    },
  },
  "fressnapf.de": {
    action: [],
    active: true,
    allowedHosts: ["fressnapf.app.baqend.com"],
    categories: {
      exclude: ["service", "magazin"],
      sel: "div[id=__navigation] ul.nav-level-1 a",
      type: "href",
      subCategories: [
        {
          sel: "div.teaser-slider-small div.swiper-wrapper a.swiper-slide",
          type: "href",
        },
      ],
    },
    crawlActions: [],
    d: "fressnapf.de",
    entryPoints: [
      {
        url: "https://www.fressnapf.de",
        category: "default",
      },
    ],
    hasEan: true,
    javascript: {
      sharedWorker: "enabled",
      webWorker: "enabled",
      serviceWorker: "disabled",
    },
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
    mimic: "a[id=header-logo]",
    paginationEl: [
      {
        type: "pagination",
        sel: "div.p-items",
        nav: "?currentPage=",
        calculation: {
          method: "product_count",
          productsPerPage: 48,
          last: "div.p-items a",
          sel: "div.p-items a",
        },
      },
    ],
    pauseOnProductPage: {
      pause: true,
      min: 800,
      max: 1000,
    },
    product: [
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "instock",
        path: [
          "offers.availability",
          "[1].offers.availability",
          "[0].offers.availability",
        ],
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "price",
        path: ["offers.price", "[1].offers.price", "[0].offers.price"],
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "ean",
        regex: '"gtin":\\s*"(\\d+)"',
        path: ["gtin", "[1].gtin", "[0].gtin"],
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "sku",
        path: "sku",
      },
      {
        parent: "div.zoom-image.g-image",
        sel: "img",
        type: "src",
        content: "image",
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
    ],
    proxyType: "mix",
    purlschema: "Prod\\w*\\/\\d*",
    queryActions: [],
    queryUrlSchema: [],
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
        "other",
      ],
    },
    waitUntil: {
      product: "load",
      entryPoint: "load",
    },
  },
  "mueller.de": {
    action: [],
    active: true,
    allowedHosts: ["static.mueller.de"],
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
    crawlActions: [],
    d: "mueller.de",
    entryPoints: [
      {
        url: "https://www.mueller.de",
        category: "default",
      },
    ],
    exceptions: [
      "https://static.mueller.de/6f23f1202b2a99aa40c25dfc48658c418d2c5bbd/assets/base/images/fallback_image.png",
    ],
    hasEan: true,
    manualCategories: [],
    mimic: "img.mu-header__logo",
    paginationEl: [
      {
        type: "pagination",
        sel: "div.mu-pagination__pages",
        nav: "?p=",
        calculation: {
          method: "count",
          last: "div.mu-pagination__pages span.mu-button2__content",
          sel: "div.mu-pagination__pages span.mu-button2__content",
        },
      },
    ],
    pauseOnProductPage: {
      pause: true,
      min: 1000,
      max: 1500,
    },
    product: [
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "price",
        path: "offers[0].price",
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "instock",
        path: "offers[0].availability",
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "ean",
        path: "gtin13",
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "sku",
        path: "sku",
      },
      {
        sel: "img.mu-image-magnify__preview-image",
        parent: "div.mu-product-gallery__preview",
        type: "src",
        content: "image",
      },
      {
        sel: "div.mu-delivery-selector-option__text",
        parent: "div.mu-delivery-selector-option__info-container",
        content: "instock",
        type: "text",
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
    proxyType: "mix",
    purlschema: "Prod\\w*\\/\\d*",
    queryActions: [],
    queryUrlSchema: [],
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
    waitUntil: {
      product: "load",
      entryPoint: "load",
    },
  },
  "reichelt.de": {
    action: [],
    active: true,
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
    crawlActions: [],
    d: "reichelt.de",
    ece: ["/&SID=(\\d|\\w)+/g"],
    entryPoints: [
      {
        url: "https://www.reichelt.de",
        category: "default",
      },
    ],
    hasEan: true,
    manualCategories: [],
    mimic: "label[for=loginb]",
    javascript: {
      sharedWorker: "disabled",
      webWorker: "disabled",
      serviceWorker: "enabled",
    },
    paginationEl: [
      {
        type: "pagination",
        sel: "div.PageLinksNavi",
        nav: ".html?ACTION=2&GROUPID=<groupid>&START=<page>&OFFSET=30&nbc=1",
        paginationUrlSchema: {
          replace: "\\.html",
          parseAndReplace: {
            regexp: "\\d+",
            replace: "<groupid>",
          },
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
    pauseOnProductPage: {
      pause: true,
      min: 1000,
      max: 1500,
    },
    product: [
      {
        parent: "div.av_price_frame",
        sel: "div[id=av_price]",
        content: "price",
        type: "text",
      },
      {
        sel: "meta[itemprop=gtin13]",
        parent: "div[id=av_articleheader]",
        type: "content",
        content: "ean",
      },
      {
        sel: "p.availability",
        parent: "div[id=av_inbasket]",
        content: "instock",
        type: "text",
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
    proxyType: "mix",
    purlschema: "Prod\\w*\\/\\d*",
    query: {
      content: "van",
    },
    queryActions: [],
    queryUrlSchema: [],
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
        "other",
      ],
    },
    waitUntil: {
      product: "load",
      entryPoint: "load",
    },
  },
  "saturn.de": {
    action: [],
    active: true,
    categories: {
      exclude: [
        "mindstart",
        "actionen",
        "fotoparadies.de",
        "brand",
        "service",
        "store",
        "myaccount",
        "content",
        "/product/",
        "b2b-business-solutions",
      ],
      sel: "",
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
    crawlActions: [
      {
        type: "element",
        sel: "div[id=mms-consent-portal-container]",
        action: "delete",
        interval: 100,
      },
      {
        type: "scroll",
        sel: "none",
        action: "scroll",
      },
    ],
    d: "saturn.de",
    entryPoints: [
      {
        url: "https://www.saturn.de",
        category: "default",
      },
    ],
    hasEan: true,
    manualCategories: [
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
    mimic: "img[data-test=styled-logo]",
    paginationEl: [
      {
        type: "recursive-more-button",
        sel: "button:is([aria-label='Mehr Produkte anzeigen'], [aria-label='Mehr Angebote'])",
        nav: "?page=",
        calculation: {
          method: "find_highest",
          last: "button:is([aria-label='Mehr Produkte anzeigen'], [aria-label='Mehr Angebote'])",
          sel: "button:is([aria-label='Mehr Produkte anzeigen'], [aria-label='Mehr Angebote'])",
        },
      },
    ],
    pauseOnProductPage: {
      pause: true,
      min: 800,
      max: 1200,
    },
    product: [
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "price",
        parent: "head",
        path: "object.offers[0].price",
        multiple: true,
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "instock",
        parent: "head",
        path: "object.offers[0].availability",
        multiple: true,
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "ean",
        parent: "head",
        path: "object.gtin13",
        multiple: true,
      },
      {
        sel: "script[type='application/ld+json']",
        type: "parse_json_element",
        content: "sku",
        parent: "head",
        path: "object.sku",
        multiple: true,
      },
      {
        sel: "img",
        parent: "div.pdp-gallery-image",
        type: "src",
        content: "image",
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
              sel: "a[data-test*=mms-product-list-item-link]",
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
              sel: "div[data-test*=product-price] span[spacing=base]",
              type: "text",
            },
          ],
        },
      },
      {
        sel: "section[id*=product-grid]",
        productCntSel: ["section[data-test=mms-search-srp-headlayout] div"],
        product: {
          sel: "section[id*=product-grid] div[data-test=mms-campaigns-productGrid-product]",
          type: "link",
          details: [
            {
              content: "image",
              sel: "picture img",
              type: "src",
            },
            {
              content: "name",
              sel: "p[data-test=product-title]",
              type: "text",
            },
            {
              content: "mnfctr",
              sel: "p[data-test=product-manufacturer]",
              type: "text",
            },
            {
              content: "price",
              sel: "div[data-test*=product-price] span[spacing=base]",
              type: "text",
            },
          ],
        },
      },
    ],
    proxyType: "mix",
    purlschema: "Prod\\w*\\/\\d*",
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: [
        "media",
        "font",
        "ping",
        "image",
        "xhr",
        "imageset",
        "sub_frame",
        "other",
      ],
    },
    waitUntil: {
      product: "load",
      entryPoint: "load",
    },
  },
  "voelkner.de": {
    action: [],
    active: true,
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
    crawlActions: [
      // {
      //   type: "button",
      //   sel: "div[id=js_reveal_cookie_content] button",
      //   btn_sel: "button",
      //   action: "click",
      //   step: 1,
      //   wait: false,
      // },
      // {
      //   type: "scroll",
      //   sel: "none",
      //   action: "scroll",
      // },
    ],
    d: "voelkner.de",
    entryPoints: [
      {
        url: "https://www.voelkner.de",
        category: "default",
      },
    ],
    hasEan: true,
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
    mimic: "a.head__wrapper__group__button svg",
    paginationEl: [
      {
        type: "pagination",
        sel: "div[id=js_search_pagination_bottom]",
        nav: "?page=",
        calculation: {
          method: "match_text",
          textToMatch: "Weitere Produkte anzeigen",
          dynamic: true,
          last: "button.button--solid.js_load_results",
          sel: "button.button--solid.js_load_results",
        },
      },
    ],
    pauseOnProductPage: {
      pause: true,
      min: 1000,
      max: 1500,
    },
    product: [
      {
        sel: "link[itemprop=availability]",
        parent: "div.product__price--large",
        type: "href",
        content: "instock",
      },
      {
        sel: "span[itemprop=price]",
        parent: "div.product__price--large",
        type: "content",
        content: "price",
      },
      {
        sel: "meta[itemprop=gtin]",
        parent: "div.grid_container.product",
        type: "content",
        content: "ean",
      },
      {
        sel: "meta[itemprop=sku]",
        parent: "div.grid_container.product",
        type: "content",
        content: "sku",
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
              sel: "div[class*=product__price__wrapper]",
              type: "text",
            },
          ],
        },
      },
      {
        sel: "div.dailydeal",
        productCntSel: ["span.reptile_tilelist__itemCount"],
        product: {
          sel: "div.deal",
          type: "not_link",
          details: [
            {
              content: "link",
              sel: "a.deal__link",
              type: "href",
            },
            {
              content: "image",
              sel: "div.deal__image img",
              type: "src",
            },
            {
              content: "name",
              sel: "span.product__title--small",
              type: "text",
            },
            {
              content: "price",
              sel: "span[itemprop=price]",
              type: "content",
            },
          ],
        },
      },
    ],
    proxyType: "mix",
    purlschema: "Prod\\w*\\/\\d*",
    queryActions: [],
    queryUrlSchema: [],
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
    waitUntil: {
      product: "load",
      entryPoint: "load",
    },
  },
  "amazon.de": {
    active: true,
    d: "amazon.de",
    entryPoints: [
      {
        url: "https://www.amazon.de/?language=de_DE",
        category: "default",
      },
    ],
    mimic: "a[id=nav-logo-sprites]",
    paginationEl: [],
    pauseOnProductPage: {
      pause: true,
      min: 800,
      max: 1500,
    },
    product: [
      {
        sel: "#productDetails_db_sections",
        head: "tbody td",
        row: "tbody td",
        type: "table",
        keys: ["asin"],
        content: "asin",
      },
      {
        sel: "#productDetails_db_sections",
        head: "tbody td",
        row: "tbody td",
        type: "table",
        keys: ["Amazon Bestseller-Rang"],
        content: "bsr",
      },
      {
        type: "src",
        parent: "#imgTagWrapperId",
        sel: "img",
        content: "a_img",
      },
      {
        sel: "#priceValue",
        parent: "#prodDetails",
        type: "value",
        content: "a_prc_test_1",
      },
      {
        sel: "#twister-plus-price-data-price",
        parent: "#twisterPlusPriceSubtotalWWDesktop_feature_div",
        type: "value",
        content: "a_prc_test_2",
      },
      {
        sel: "#twisterPlusWWDesktop > div",
        type: "parse_json_element",
        content: "a_prc_test_3",
        path: "desktop_buybox_group_1[0].priceAmount",
      },
      {
        sel: "span.a-offscreen",
        parent: "div[id=corePrice_feature_div] span.a-price",
        type: "text",
        content: "a_prc",
      },
    ],
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
    proxyType: "mix",
    queryActions: [],
    queryUrlSchema: [
      {
        baseUrl: "https://www.amazon.de/s?k=<query>&language=de_DE",
        category: "default",
      },
    ],
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
    waitUntil: {
      product: "load",
      entryPoint: "load",
    },
  },
  "sellercentral.amazon.de": {
    active: true,
    d: "sellercentral.amazon.de",
    entryPoints: [
      {
        url: "https://sellercentral.amazon.de/hz/fba/profitabilitycalculator/index?lang=de_DE",
        category: "default",
      },
    ],
    allowedHosts: ["d29zc3pk4tzg0k.cloudfront.net"],
    mimic: "div[id=a-page]",
    crawlActions: [],
    actions: [],
    paginationEl: [],
    productList: [],
    pauseOnProductPage: {
      pause: true,
      min: 750,
      max: 900,
    },
    product: [
      {
        sel: "img",
        parent: "div[id=product-detail-left]",
        type: "src",
        content: "a_img",
        step: 1,
      },
      {
        sel: "thead tr td kat-link",
        parent: "table.product-detail-table-left",
        type: "label",
        content: "name",
        step: 1,
      },
      {
        sel: "tbody tr td:nth-child(2)",
        parent: "table.product-detail-table-left",
        type: "text",
        content: "asin",
        step: 1,
      },
      {
        sel: "tbody tr:nth-child(4) td:nth-child(2)",
        parent: "table.product-detail-table-right",
        type: "text",
        content: "totalOfferCount",
        step: 1,
      },
      {
        sel: "span[part=label-text]",
        parent:
          "kat-box[id=ProgramCard]:nth-child(2) div.revenue-section kat-label.subsection-content-currency",
        type: "text",
        shadowRoot: true,
        content: "a_prc",
        step: 1,
      },
      {
        sel: "tbody tr:nth-child(3) td:nth-child(2)",
        parent: "table.product-detail-table-right",
        type: "text",
        content: "sellerRank",
        step: 1,
      },
      {
        sel: "tbody tr:nth-child(5) td:nth-child(5)",
        parent: "table.product-detail-table-right",
        type: "text",
        content: "buyBoxIsAmazon",
        step: 1,
      },
      {
        sel: "kat-label",
        parent: "kat-expander div.section-expander-content",
        type: "text",
        content: "costs.azn",
        step: 1,
      },
      {
        sel: "kat-label",
        parent:
          "kat-expander div.section-expander-content div.input-block:nth-child(3)",
        type: "text",
        content: "costs.varc",
        step: 1,
      },
      {
        sel: "kat-input",
        parent: "kat-expander:nth-child(4)",
        type: "value",
        content: "tax",
        step: 1,
      },
      {
        sel: "span[part=label-text]",
        parent: "kat-expander:nth-child(2) div[slot=badge] kat-label",
        shadowRoot: true,
        type: "text",
        content: "costs.tpt",
        step: 1,
      },
      {
        sel: "span[part=label-text]",
        parent: "kat-expander:nth-child(3) div[slot=badge] kat-label",
        shadowRoot: true,
        type: "text",
        content: "costs.strg.1_hy",
        step: 1,
      },
      {
        sel: "span[part=label-text]",
        parent: "kat-expander:nth-child(3) div[slot=badge] kat-label",
        shadowRoot: true,
        type: "text",
        content: "costs.strg.2_hy",
        step: 2,
      },
    ],
    leaveDomainAsIs: true,
    proxyType: "mix",
    queryActions: [
      {
        type: "shadowroot-button",
        sel: "kat-button[label='Als Gast fortfahren']",
        btn_sel: "button",
        action: "click",
        step: 1,
        wait: false,
      },
      {
        type: "shadowroot-button",
        sel: "kat-dropdown[label='Amazon Shop']",
        btn_sel: "div.indicator",
        action: "click",
        step: 1,
        wait: false,
      },
      {
        type: "button",
        sel: "kat-option[value='DE']",
        action: "click",
        step: 1,
        wait: false,
      },
      {
        type: "shadowroot-input",
        sel: "kat-input[label='Bei Amazon nach dem Produkt suchen']",
        input_sel: "input",
        action: "type",
        step: 1,
        wait: false,
        what: ["product"],
      },
      {
        type: "shadowroot-button-test",
        sel: "kat-button[label='Suchen']",
        btn_sel: "button",
        action: "click",
        step: 1,
        wait: true,
      },
      {
        type: "shadowroot-button-test",
        sel: "kat-box[id=product-item] kat-button",
        btn_sel: "button",
        action: "click",
        step: 1,
        wait: true,
      },
      {
        type: "shadowroot-button-test",
        sel: "kat-button[label='Oktober–Dezember']",
        btn_sel: "button",
        action: "click",
        waitDuration: 200,
        wait: false,
        step: 2,
      },
    ],
    queryUrlSchema: [
      {
        baseUrl: "https://www.amazon.de/s?k=<query>&language=de_DE",
        category: "default",
      },
    ],
    resourceTypes: {
      query: [
        "media",
        "font",
        // "stylesheet",
        "ping",
        "other",
        "image",
        // "xhr",
        // "fetch",
        "imageset",
        "sub_frame",
        // "script",
      ],
    },
    waitUntil: {
      product: "load",
      entryPoint: "load",
    },
  },
  "ebay.de": {
    active: true,
    d: "ebay.de",
    entryPoints: [
      {
        url: "https://www.ebay.de",
        category: "default",
      },
    ],
    mimic: "a[id=gh-la]",
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
    proxyType: "mix",
    queryActions: [],
    product: [
      {
        sel: "div[data-testid=x-about-this-item] div[data-testid='ux-layout-section-evo__item']",
        head: "dt",
        row: "dd",
        type: "table",
        keys: ["ean", "upc", "gtin", "gtin13", "gtin11"],
        content: "ean",
      },
      {
        sel: "div[id=ProductDetails]",
        head: "div.s-name",
        row: "div.s-value",
        type: "table",
        keys: ["ean", "upc", "gtin", "gtin13", "gtin11"],
        content: "ean",
      },
      {
        sel: "img",
        parent: "div.ux-image-carousel-item",
        type: "src",
        content: "image",
      },
      { 
        sel: 'span',
        parent: "div.vim.d-statusmessage",
        content: 'instock', 
        type: 'text'
      },
      { 
        sel: 'span',
        parent: "div.vim.x-alert",
        content: 'instock', 
        type: 'text'
      },
      {
        parent: "div.seo-breadcrumbs-container",
        sel: "li",
        listItemInnerSel: "a",
        type: "list",
        content: "categories",
        listItemType: "href",
      },
      {
        parent: "div[id=mainContent]",
        sel: "div.x-price-primary span.ux-textspans",
        content: "e_prc",
        type: "text",
      },
    ],
    queryUrlSchema: [
      {
        baseUrl:
          "https://www.ebay.de/sch/i.html?_fsrp=1&rt=nc&_from=R40&_nkw=<query>&_sacat=0&LH_BIN=1&_sop=15&LH_ItemCondition=3&LH_SellerType=2&LH_PrefLoc=3&LH_Sold=1&LH_Complete=1",
        category: "default",
      },
    ],
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
    waitUntil: {
      product: "load",
      entryPoint: "load",
    },
  },
  "action.com": {
    action: [],
    active: false,
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
    crawlActions: [],
    d: "action.com",
    entryPoints: [
      {
        url: "https://www.action.com/de-de",
        category: "default",
      },
    ],
    manualCategories: [],
    mimic: "nav[data-testid='top-menu'] a svg.h-6",
    paginationEl: [
      {
        type: "pagination",
        sel: "div[data-testid=grid-pagination-items-desktop]",
        nav: "?page=",
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
    proxyType: "mix",
    purlschema: "Prod\\w*\\/\\d*",
    queryActions: [],
    queryUrlSchema: [],
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
    waitUntil: {
      product: "domcontentloaded",
      entryPoint: "domcontentloaded",
    },
  },
  "sportspar.de": {
    action: [],
    active: false,
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
    crawlActions: [],
    d: "sportspar.de",
    entryPoints: [
      {
        url: "https://www.sportspar.de",
        category: "default",
      },
    ],
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
    mimic: "#bToprow > div.row > div.col-logo > div > a > img",
    paginationEl: [
      {
        type: "pagination",
        sel: "a.btn.is--primary.is--icon-right.js--load-more",
        nav: "?p=",
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
    proxyType: "mix",
    purlschema: "Prod\\w*\\/\\d*",
    queryActions: [],
    queryUrlSchema: [],
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
    waitUntil: {
      product: "domcontentloaded",
      entryPoint: "domcontentloaded",
    },
  },
  "weltbild.de": {
    action: [],
    active: false,
    categories: {
      exclude: ["nur-bei-weltbild", "alles"],
      sel: "nav.nav-container a.nav-link",
      type: "href",
      visible: false,
      subCategories: [
        {
          visible: false,
          sel: "section.sx-box.listnavigation a:not(.current)",
          type: "href",
        },
        {
          visible: false,
          sel: "div.rb-linklist-image-text a",
          type: "href",
        },
      ],
    },
    crawlActions: [],
    d: "weltbild.de",
    entryPoints: [
      {
        url: "https://www.weltbild.de",
        category: "default",
      },
    ],
    manualCategories: [],
    mimic: "img[alt=Weltbild]",
    paginationEl: [
      {
        type: "pagination",
        sel: "div.pagination",
        nav: "?seite=",
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
          sel: "div[property=list] div.inner-flex-container",
          type: "not_link",
          details: [
            {
              content: "link",
              sel: "a[data-load-index]",
              type: "href",
            },
            {
              content: "image",
              sel: "div.image-container img",
              type: "data-srcset",
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
    ],
    proxyType: "de",
    purlschema: "",
    queryActions: [],
    queryUrlSchema: [],
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
    waitUntil: {
      product: "load",
      entryPoint: "load",
    },
  },
  "kaufland.de": {
    action: [],
    active: false,
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
    crawlActions: [],
    d: "kaufland.de",
    entryPoints: [
      {
        url: "https://www.kaufland.de",
        category: "default",
      },
    ],
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
    mimic: "span.svg-logo.rh-main__logo-normal svg",
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
    proxyType: "mix",
    purlschema: "",
    queryActions: [],
    queryUrlSchema: [],
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
    waitUntil: {
      product: "domcontentloaded",
      entryPoint: "domcontentloaded",
    },
  },
  "otto.de": {
    action: [],
    active: false,
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
    crawlActions: [],
    d: "otto.de",
    entryPoints: [
      {
        url: "https://www.otto.de",
        category: "default",
      },
    ],
    manualCategories: [],
    mimic: "svg.pl_logo",
    paginationEl: [
      {
        type: "pagination",
        sel: "ul.reptile_paging.reptile_paging--bottom",
        nav: "?l=gp&o=<page>",
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
    proxyType: "mix",
    purlschema: "Prod\\w*\\/\\d*",
    queryActions: [],
    queryUrlSchema: [],
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
    waitUntil: {
      product: "load",
      entryPoint: "load",
    },
  },
  "costway.de": {
    action: [],
    active: false,
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
    crawlActions: [],
    d: "costway.de",
    entryPoints: [
      {
        url: "https://www.costway.de",
        category: "default",
      },
    ],
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
    mimic: "img[title='COSTWAY']",
    paginationEl: [
      {
        type: "pagination",
        sel: "div.pages",
        nav: "?p=",
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
    proxyType: "mix",
    purlschema: "Prod\\w*\\/\\d*",
    queryActions: [],
    queryUrlSchema: [],
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
    waitUntil: {
      product: "domcontentloaded",
      entryPoint: "domcontentloaded",
    },
  },
  "quelle.de": {
    action: [],
    active: false,
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
    crawlActions: [],
    d: "quelle.de",
    entryPoints: [
      {
        url: "https://www.quelle.de",
        category: "default",
      },
    ],
    manualCategories: [
      {
        name: "Deals des Monats",
        link: "https://www.quelle.de/themen-aktionen/sale/deals-des-monats",
      },
    ],
    mimic: "header > a > svg",
    paginationEl: [
      {
        type: "pagination",
        sel: "nav.MuiPagination-root",
        nav: "?p=",
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
    proxyType: "mix",
    purlschema: "Prod\\w*\\/\\d*",
    queryActions: [],
    queryUrlSchema: [],
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
    waitUntil: {
      product: "domcontentloaded",
      entryPoint: "domcontentloaded",
    },
  },
  "actionsports.de": {
    action: [],
    active: false,
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
    crawlActions: [],
    d: "actionsports.de",
    entryPoints: [
      {
        url: "https://www.actionsports.de",
        category: "default",
      },
    ],
    manualCategories: [],
    mimic: "a.logo--link img",
    paginationEl: [
      {
        type: "pagination",
        sel: "div.listing--bottom-paging",
        nav: "?p=",
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
    proxyType: "mix",
    purlschema: "Prod\\w*\\/\\d*",
    queryActions: [
      {
        type: "shadowroot-button",
        sel: "aside[id=usercentrics-cmp-ui]",
        btn_sel: "button[id=deny]",
        action: "click",
        wait: false,
      },
    ],
    queryUrlSchema: [],
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
    waitUntil: {
      product: "domcontentloaded",
      entryPoint: "domcontentloaded",
    },
  },
  "mindfactory.de": {
    action: [],
    active: false,
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
    crawlActions: [],
    d: "mindfactory.de",
    entryPoints: [
      {
        url: "https://www.mindfactory.de",
        category: "default",
      },
    ],
    manualCategories: [],
    mimic: "#bToprow > div.row > div.col-logo > div > a > img",
    paginationEl: [
      {
        type: "pagination",
        sel: "ul.pagination",
        nav: "/page/",
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
    proxyType: "de",
    purlschema: "Prod\\w*\\/\\d*",
    queryActions: [],
    queryUrlSchema: [],
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
    waitUntil: {
      product: "domcontentloaded",
      entryPoint: "domcontentloaded",
    },
  },
  "fahrrad.de": {
    action: [],
    active: false,
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
    crawlActions: [],
    d: "fahrrad.de",
    entryPoints: [
      {
        url: "https://www.fahrrad.de",
        category: "default",
      },
    ],
    manualCategories: [],
    mimic: "a.logo",
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
    proxyType: "mix",
    purlschema: "Prod\\w*\\/\\d*",
    queryActions: [],
    queryUrlSchema: [],
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
    waitUntil: {
      product: "domcontentloaded",
      entryPoint: "domcontentloaded",
    },
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
