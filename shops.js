export const shops = {
  "suchen.mobile.de": {
    waitUntil: { product: "domcontentloaded", entryPoint: "domcontentloaded" },
    queryUrlSchema: [
      {
        baseUrl: `https://suchen.mobile.de/fahrzeuge/search.html?isSearchRequest=true&ms=<query>&od=down&s=Truck&sb=doc&vc=ConstructionMachine`,
        searchParams: {
          queryPart: {
            seperator: ";;;",
          },
          brand: {
            key: "key",
          },
          year: {
            param: "&yc=",
            min: "",
            max: ":",
          },
        },
        category: "ConstructionMachine",
      },
    ],
    entryPoint: [
      {
        url: "https://suchen.mobile.de/fahrzeuge/search.html?s=Truck&vc=ConstructionMachine",
        category: "ConstructionMachine",
      },
    ],
    queryActions: [
      {
        type: "button",
        sel: "button.mde-consent-accept-btn",
        action: "click",
        wait: false,
      },
    ],
    paginationEl: {
      type: "pagination",
      sel: "div[data-testid='srp-pagination']",
      nav: "&pageNumber=",
      button: {
        sel: "div[data-testid=srp-pagination] button.FxqoS.cq2eI.ZUdn6 span span",
        hint: "span span",
        wait: true,
      },
    },
    productList: [
      {
        sel: 'article[data-testid="result-list-container"]',
        product: {
          sel: 'a[data-testid*="result-listing-"]',
          type: "link",
          details: [
            {
              content: "image",
              sel: "img[data-testid*='result-listing-image-']",
              type: "src",
            },
            {
              content: "name",
              sel: "a[data-testid*='result-listing-'] h2",
              type: "text",
            },
            {
              content: "description",
              sel: "section[data-testid='listing-details']",
              type: "text",
            },
            {
              content: "price",
              sel: "span[data-testid='price-label']",
              type: "text",
            },
          ],
        },
      },
    ],
  },
  "idealo.de": {
    resourceTypes: {
      crawl: ['media', 'font', 'stylesheet', 'ping','image', 'xhr', 'fetch', 'imageset','sub_frame']
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
      mainCategory: 15,
      subCategory: 40,
      pages: 20,
    },
    categories: {
      exclude: ["flug", "flüge", "hotel"],
      sel: "div[id*=swiper-wrapper-] div.swiper-slide.top-categories-no-swipe a",
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
  "machineryline.info": {
    waitUntil: { product: "load", entryPoint: "domcontentloaded" },
    entryPoint: "https://machineryline.info",
    queryUrlSchema: [
      {
        baseUrl: `https://machineryline.info/search_text.php?query=<query>`,
        category: "default",
      },
    ],
    queryActions: [
      {
        sel: "div.items a",
        type: "button",
        name: "QueryAction 3",
        wait: true,
        action: "click",
      },
      {
        sel: "span[data-value=cgrp1]",
        type: "button",
        name: "QueryAction 4",
        wait: true,
        action: "click",
      },
      {
        sel: "input[name=ym0]",
        type: "input",
        name: "QueryAction 3",
        what: ["year.min"],
      },
      {
        sel: "input[name=ym1]",
        type: "input",
        name: "QueryAction 4",
        what: ["year.max"],
      },
    ],
    paginationEl: {
      type: "pagination",
      sel: "div.paginator",
      nav: "&page=",
      calculation: {
        method: "first_last",
        last: "div.paginator a.pgn-item.pgn-last",
        sel: "div.paginator a.pgn-page",
      },
    },
    productList: [
      {
        sel: "div.sales-list",
        type: "container",
        product: {
          sel: "div.item.sales-list-item",
          type: "container",
          details: [
            {
              content: "link",
              sel: "div.description div.title a",
              type: "href",
            },
            {
              content: "image",
              sel: "picture img",
              type: "src",
            },
            {
              content: "year",
              sel: "div.main-properties span.prop-c_year span.value",
              type: "text",
            },
            {
              content: "name",
              sel: "div.description div.title a",
              type: "title",
            },
            {
              content: "description",
              sel: "div.additional-properties",
              type: "text",
            },
            {
              content: "price",
              sel: "div.price span.price-value",
              type: "text",
            },
          ],
        },
      },
    ],
  },
  "mascus.de": {
    waitUntil: { product: "domcontentloaded", entryPoint: "networkidle2" },
    entryPoint: "https://www.mascus.de",
    queryUrlSchema: [
      {
        baseUrl: `https://www.mascus.de/<query>/catalogs=construction<year><continent>/1,relevance,search.html`,
        searchParams: {
          brand: {
            key: "value",
          },
          contient: "&continentcodes=150",
          year: {
            min: "&yearofmanufacture.min=",
            max: "&yearofmanufacture.max=",
          },
        },
        suffix: "/1,relevance,search.html",
        category: "ConstructionMachine",
      },
    ],
    queryActions: [
      // {
      //   type: "input",
      //   sel: "input[id='searchBarInput']",
      //   what: ["brand", "model"],
      // },
      // {
      //   type: "button",
      //   sel: "button[class*=SearchBar__SearchButton]",
      //   action: "click",
      //   wait: true,
      // },
    ],
    paginationEl: {
      type: "infinite_scroll",
      sel: "div[class*=SearchResult_paginationUI__]",
    },
    productList: [
      {
        sel: "div[class*='SearchResult_searchResult___']",
        type: "container",
        product: {
          sel: "div[class*='SearchResult_searchResultItemWrapper__']",
          type: "container",
          details: [
            {
              content: "link",
              sel: "a",
              type: "href",
            },
            {
              content: "image",
              sel: "img",
              type: "src",
            },
            {
              content: "name",
              sel: "div[class*=Wrappers] div[class*=typography__Text]",
              type: "text",
            },
            {
              content: "description",
              sel: "p[class*=typography__BodyText2]",
              type: "text",
            },
            {
              content: "price",
              sel: "div[class*=SearchResult_priceWrapper__]",
              type: "text",
            },
          ],
        },
      },
    ],
  },
  "alternate.de": {
    limit: {
      mainCategory: 15,
      subCategory: 12,
      pages: 20,
      steps: 10,
    },
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
    entryPoint: "https://www.amazon.de",
    queryActions: [
      {
        type: "input",
        sel: "input[id='twotabsearchtextbox']",
        what: ["product"],
      },
      {
        type: "button",
        sel: "input[id=nav-search-submit-button]",
        action: "click",
        wait: true,
      },
    ],
    paginationEl: {},
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
              sel: "span.a-offscreen",
              type: "text",
            },
          ],
        },
      },
    ],
  },
  "ebay.de": {
    waitUntil: { product: "domcontentloaded", entryPoint: "domcontentloaded" },
    entryPoint: "https://www.ebay.de",
    queryActions: [
      {
        type: "input",
        sel: "input[id=gh-ac]",
        what: ["product"],
      },
      {
        type: "button",
        sel: "input[id=gh-btn]",
        action: "click",
        wait: true,
      },
    ],
    paginationEl: {},
    productList: [
      {
        sel: "ul.srp-results",
        type: "container",
        product: {
          sel: "li.s-item",
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
