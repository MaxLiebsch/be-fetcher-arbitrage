import { Shop } from '@dipmaxtech/clr-pkg';

export const shops: { [key: string]: Shop } = {
  'allesfuerzuhause.de': {
    actions: [],
    allowedHosts: ['allesfuerzuhause.de'],
    leaveDomainAsIs: true,
    active: true,
    categories: {
      exclude: ['mode'],
      sel: 'li.navi-header__cat ul li > a',
      type: 'href',
      visible: false,
      subCategories: [
        {
          visible: false,
          sel: 'div.ep-cat--subcat a',
          type: 'href',
        },
      ],
    },
    crawlActions: [
      {
        type: 'button',
        sel: 'button[id=ctl07_declinebtn]',
        action: 'click',
        wait: false,
        name: 'click on consent',
      },
    ],
    d: 'allesfuerzuhause.de',
    entryPoints: [
      {
        url: 'https://www.allesfuerzuhause.de',
        category: 'default',
      },
    ],
    hasEan: true,
    manualCategories: [],
    mimic: 'div.header--logo',
    paginationEl: [
      {
        type: 'pagination',
        sel: 'ul.pagination li',
        nav: '?comID=l15$c1$c3$c1&pix=<page>&ajaxtargets=product-grid',
        paginationUrlSchema: {
          replace: 'attach_end',
          calculation: {
            method: 'offset',
            offset: 1,
          },
        },
        calculation: {
          method: 'find_highest',
          last: 'ul.pagination li',
          sel: 'ul.pagination li',
        },
      },
    ],
    pauseOnProductPage: {
      pause: true,
      min: 700,
      max: 900,
    },
    product: [
      {
        sel: 'div.loadbeeTabContent',
        parent: 'div[id=ep-tab1-c]',
        type: 'data-loadbee-gtin',
        content: 'ean',
      },
      {
        sel: 'script[data-flix-ean]',
        parent: 'div[id=ep-tab1-c]',
        type: 'data-flix-ean',
        content: 'ean',
      },
      {
        parent: 'div.product-cart--cart',
        sel: 'div.product-as-cart',
        type: 'text',
        content: 'instock',
      },
      {
        sel: 'div.product-price--final',
        parent: 'div.product-price',
        type: 'text',
        content: 'price',
      },
      {
        sel: 'h1.ep-det__title',
        parent: 'div.ep-top--right',
        type: 'text',
        content: 'name',
      },
      {
        sel: 'img',
        parent: 'div.ep-gall',
        type: 'src',
        content: 'image',
      },
    ],
    productList: [
      {
        sel: 'div[id=product-grid] div[id=grid-ep]',
        productCntSel: [],
        product: {
          sel: 'div[id=product-grid] div[id=grid-ep] div.ep-prev',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'figure.ep-prev__img a',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'figure.ep-prev__img img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'figure.ep-prev__img a',
              type: 'title',
            },
            {
              content: 'price',
              sel: 'strong.ep-prev--price__price-sale',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'mix',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: [
        'media',
        'font',
        'ping',
        'image',
        'other',
        'script',
        'fetch',
        'xhr',
        'stylesheet',
      ],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'aldi-onlineshop.de': {
    actions: [],
    allowedHosts: [
      'algolia.net',
      'cdns.eu1.gigya.com',
      'algolianet.com',
      'mjdumziil5-dsn.algolia.net',
      'mjdumziil5-3.algolianet.com',
      'mjdumziil5-2.algolianet.com',
      'mjdumziil5-1.algolianet.com',
    ],
    active: true,
    categories: {
      exclude: ['mode'],
      sel: '',
      type: 'href',
      visible: false,
      subCategories: [
        {
          visible: false,
          sel: 'nav.category-nav a',
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'aldi-onlineshop.de',
    entryPoints: [
      {
        url: 'https://www.aldi-onlineshop.de',
        category: 'default',
      },
    ],
    hasEan: true,
    manualCategories: [
      { link: 'https://www.aldi-onlineshop.de/c/garten-2/', name: 'Garten' },
      {
        link: 'https://www.aldi-onlineshop.de/c/baumarkt-54/',
        name: 'Baumarkt',
      },
      {
        link: 'https://www.aldi-onlineshop.de/c/sport--outdoor-97/',
        name: 'Sport & Outdoor',
      },
      {
        link: 'https://www.aldi-onlineshop.de/c/elektronik--computer-4/',
        name: 'Elektronik & Computer',
      },
      {
        link: 'https://www.aldi-onlineshop.de/c/haushalt--kueche-5/',
        name: 'Haushalt & Küche',
      },
      {
        link: 'https://www.aldi-onlineshop.de/c/wohnen--einrichten-6/',
        name: 'Wohnen & Einrichten',
      },
      {
        link: 'https://www.aldi-onlineshop.de/c/tierbedarf-78/',
        name: 'Tierbedarf',
      },
      {
        link: 'https://www.aldi-onlineshop.de/c/drogerie-1/',
        name: 'Drogerie',
      },
      { link: 'https://www.aldi-onlineshop.de/c/wein-70/', name: 'Wein' },
      {
        link: 'https://www.aldi-onlineshop.de/c/bestseller-9/',
        name: 'Bestseller',
      },
    ],
    mimic: 'div.logo-text span.logo-svg',
    paginationEl: [
      {
        type: 'pagination',
        sel: 'a.js-algolia-show-more',
        nav: '?page=',
        calculation: {
          productsPerPage: 24,
          method: 'product_count',
          last: 'a.js-algolia-show-more',
          sel: 'a.js-algolia-show-more',
        },
      },
    ],
    pauseOnProductPage: {
      pause: true,
      min: 3600,
      max: 4000,
    },
    product: [
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        path: 'gtin13',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'sku',
        path: 'sku',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'instock',
        path: 'offers.availability',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'price',
        path: 'offers.price',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'mnfctr',
        path: 'brand',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'name',
        path: 'name',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'image',
        path: 'image.contentUrl',
      },
    ],
    productList: [
      {
        sel: 'section.product-card-list',
        productCntSel: ['span.js-filter-results-text'],
        waitProductCntSel: 4000,
        awaitProductCntSel: true,
        product: {
          sel: 'section.product-card-list article.product-item',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a.card-action',
              type: 'href',
            },
            {
              content: 'mnfctr',
              sel: 'span.span.product-item__brand-name',
              type: 'text',
            },
            {
              content: 'image',
              sel: 'div.product-item__media__image-wrapper img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'em.product-item__product-name',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'span.price__main',
              type: 'text',
            },
          ],
        },
      },
      {
        sel: 'div.product-overview',
        productCntSel: ['span.js-filter-results-text'],
        waitProductCntSel: 4000,
        awaitProductCntSel: true,
        product: {
          sel: 'div.product-overview article.product-item',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a.card-action',
              type: 'href',
            },
            {
              content: 'mnfctr',
              sel: 'span.product-item__brand-name',
              type: 'text',
            },
            {
              content: 'image',
              sel: 'div.product-item__media__image-wrapper img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'em.product-item__product-name',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'span.price__main',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'mix',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: [
        'media',
        'font',
        'ping',
        'image',
        'other',
        // "script",
        // "fetch",
        // "xhr",
        // "stylesheet",
      ],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'alternate.de': {
    actions: [],
    active: true,
    categories: {
      exclude: ['generalüberholt', 'pc-konfigurator', 'alternate-pc'],
      sel: 'div[id=navigation-tree] a',
      type: 'href',
      subCategories: [
        {
          sel: 'div[id=category] div.accordion a',
          type: 'href',
        },
      ],
    },
    category: [],
    crawlActions: [],
    d: 'alternate.de',
    entryPoints: [
      {
        url: 'https://www.alternate.de',
        category: 'default',
      },
    ],
    hasEan: true,
    manualCategories: [
      {
        name: 'Tages Deals',
        link: 'https://www.alternate.de/TagesDeals',
      },
    ],
    mimic: 'img.header-logo',
    paginationEl: [
      {
        type: 'pagination',
        sel: 'div.d-flex.justify-content-center.align-items-baseline',
        nav: '?page=',
        calculation: {
          method: 'count',
          last: '',
          sel: 'div.d-flex.justify-content-center.align-items-baseline a',
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
        type: 'parse_json_element',
        content: 'cur',
        path: 'offers.priceCurrency',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'price',
        path: 'offers.price',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'instock',
        path: 'offers.availability',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        path: ['gtin8', '[0].gtin8'],
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'sku',
        path: ['sku', '[0].sku'],
      },
      {
        sel: 'div.nav-product-details table',
        head: 'td.c1',
        row: 'td.c4',
        type: 'table',
        content: 'ean',
      },
    ],
    productList: [
      {
        sel: 'div[id=dailyDeals]',
        productCntSel: ['div.col-12.col-lg-6.my-2.my-lg-0 > div > div'],
        product: {
          sel: 'a.card',
          type: 'link',
          details: [
            {
              content: 'image',
              sel: 'img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'div.product-name',
              type: 'nested',
              remove: 'span',
            },
            {
              content: 'nameSub',
              sel: 'span.product-name-sub',
              type: 'text',
            },
            {
              content: 'description',
              sel: 'ul.product-info',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'span.price',
              type: 'text',
            },
          ],
        },
      },
      {
        sel: 'div.grid-container.listing-mosaic',
        productCntSel: ['div.col-12.col-lg-6.my-2.my-lg-0 > div > div'],
        product: {
          sel: 'a.card',
          type: 'link',
          details: [
            {
              content: 'image',
              sel: 'div.card-header img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'div.card-body div.product-name',
              type: 'nested',
              remove: 'span',
            },
            {
              content: 'description',
              sel: 'ul.product-info',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.card-footer span.price',
              type: 'text',
            },
          ],
        },
      },
      {
        sel: 'div.grid-container.listing',
        productCntSel: ['div.col-12.col-lg-6.my-2.my-lg-0 > div > div'],
        product: {
          sel: 'a.card',
          type: 'link',
          details: [
            {
              content: 'image',
              sel: 'div.product-image img',
              type: 'src',
            },
            {
              content: 'nameSub',
              sel: 'span.product-name-sub',
              type: 'text',
            },
            {
              content: 'instock',
              sel: 'div.delivery-info',
              type: 'text',
            },
            {
              content: 'name',
              sel: 'div.product-name',
              type: 'nested',
              remove: 'span',
            },
            {
              content: 'description',
              sel: 'ul.product-info',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'span.price',
              type: 'text',
            },
          ],
        },
      },
      {
        sel: 'div[id=highlights-inner-container]',
        productCntSel: ['div.col-12.col-lg-6.my-2.my-lg-0 > div > div'],
        product: {
          sel: 'a.card',
          type: 'link',
          details: [
            {
              content: 'image',
              sel: 'img.ProductPicture',
              type: 'src',
            },
            {
              content: 'instock',
              sel: 'div.delivery-info',
              type: 'text',
            },
            {
              content: 'mnfctr',
              sel: 'div.manufacturer',
              type: 'text',
            },
            {
              content: 'name',
              sel: 'div.product-name',
              type: 'nested',
              remove: 'span',
            },
            {
              content: 'description',
              sel: 'ul.product-info',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.price',
              type: 'text',
            },
          ],
        },
      },
      {
        sel: 'div[id=epoq-widget-entrypage]',
        productCntSel: ['div.col-12.col-lg-6.my-2.my-lg-0 > div > div'],
        product: {
          sel: 'a.card',
          type: 'link',
          details: [
            {
              content: 'image',
              sel: 'img.ProductPicture',
              type: 'src',
            },
            {
              content: 'instock',
              sel: 'div.delivery-info',
              type: 'text',
            },
            {
              content: 'mnfctr',
              sel: 'div.manufacturer',
              type: 'text',
            },
            {
              content: 'name',
              sel: 'div.product-name',
              type: 'nested',
              remove: 'span',
            },
            {
              content: 'description',
              sel: 'ul.product-info',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.price',
              type: 'text',
            },
          ],
        },
      },
      {
        sel: 'div:is(.product-carousel,[id=epoq-widget-categorypage])',
        productCntSel: ['div.col-12.col-lg-6.my-2.my-lg-0 > div > div'],
        product: {
          sel: 'a.card',
          type: 'link',
          details: [
            {
              content: 'image',
              sel: 'img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'div.product-name',
              type: 'nested',
              remove: 'span',
            },
            {
              content: 'price',
              sel: 'span.price',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.price',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'mix',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: [
        'media',
        'font',
        'stylesheet',
        'ping',
        'image',
        'xhr',
        'fetch',
        'script',
        'other',
      ],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'alza.de': {
    actions: [],
    active: true,
    allowedHosts: ['cdn.alza.cz', '1603811301.rsc.cdn77.org'],
    categories: {
      visible: false,
      exclude: ['wie-baue', 'unsere-marken'],
      sel: 'div.js-left-category-menu li a.l0-catLink',
      type: 'href',
      subCategories: [
        {
          sel: 'div.category-tiles__categories a.category-tiles__tile',
          type: 'href',
          visible: false,
        },
        {
          sel: 'div.react-category-tiles a',
          type: 'href',
          visible: false,
        },
      ],
    },
    crawlActions: [],
    d: 'alza.de',
    entryPoints: [
      {
        url: 'https://www.alza.de',
        category: 'default',
      },
    ],
    exceptions: ['https://cdn.alza.cz/Foto/ImgGalery/boxImgPlaceholder-f1.png'],
    hasEan: true,
    manualCategories: [],
    mimic: 'header a[class*=header-] img',
    paginationEl: [
      {
        type: 'pagination',
        sel: 'div[id=pagerbottom]',
        nav: '#f&cst=null&cud=0&pg=',
        calculation: {
          method: 'product_count',
          productsPerPage: 24,
          dynamic: true,
          last: 'div[id=pagerbottom] a.pgn',
          sel: 'div[id=pagerbottom] a.pgn',
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
        type: 'parse_json_element',
        parent: 'div[id=content0c]',
        content: 'price',
        regexp: '"price":\\s*"(\\S+)"',
        path: 'offers.price',
        multiple: true,
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        parent: 'div[id=content0c]',
        multiple: true,
        regexp: '"availability":\\s*"(\\S+)"',
        content: 'instock',
        path: 'offers.availability',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        parent: 'div[id=content0c]',
        regexp: '"gtin13":\\s*"(\\d+)"',
        multiple: true,
        path: 'gtin13',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'sku',
        regexp: '"sku":\\s*"(\\S+)"',
        parent: 'div[id=content0c]',
        multiple: true,
        path: 'sku',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'mku',
        regexp: '"mku":\\s*"(\\S+)"',
        parent: 'div[id=content0c]',
        multiple: true,
        path: 'mpn',
      },
    ],
    productList: [
      {
        sel: 'div[id=boxes]',
        productCntSel: ['div[id=lblNumberItem0] span.numberItem'],
        product: {
          sel: 'div[id=boxes] div.browsingitem',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a.pc.browsinglink',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'a.pc.browsinglink img',
              type: 'srcset',
            },
            {
              content: 'name',
              sel: 'a.name.browsinglink',
              type: 'text',
            },
            {
              content: 'description',
              sel: 'div.Description',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'span.price-box__price',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'de',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: ['media', 'font', 'image'],
      product: [
        'media',
        'manifest',
        'font',
        'image',
        'xhr',
        'other',
        'ping',
        'fetch',
        'script',
        'stylesheet',
      ],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'amazon.de': {
    active: true,
    d: 'amazon.de',
    entryPoints: [
      {
        url: 'https://www.amazon.de/?language=de_DE',
        category: 'default',
      },
    ],
    mimic: 'a[id=nav-logo-sprites]',
    paginationEl: [],
    crawlActions: [],
    pauseOnProductPage: {
      pause: true,
      min: 800,
      max: 1500,
    },
    pageErrors: [
      {
        text: 'Leider ist ein Fehler aufgetreten',
        sel: 'div[cel_widget_id=dpx-ppd_csm_instrumentation_wrapper] div.a-alert-content',
        errorType: 'AznUnexpectedError',
      },
    ],
    product: [
      {
        sel: '#productDetails_db_sections',
        head: 'tbody th',
        row: 'tbody td',
        type: 'table',
        keys: ['asin'],
        content: 'asin',
      },
      // {
      //   sel: "#productDetails_db_sections",
      //   head: "tbody th",
      //   row: "tbody td",
      //   type: "table",
      //   keys: ["amazonbestsellerrang"],
      //   content: "bsr",
      // },
      {
        sel: '[id=acrCustomerReviewText]',
        parent: '#productDetails_db_sections',
        type: 'text',
        content: 'a_reviewcnt',
      },
      {
        sel: 'span.a-size-base',
        parent: '[id=acrPopover]',
        type: 'text',
        content: 'a_rating',
      },
      {
        type: 'src',
        parent: '#imgTagWrapperId',
        sel: 'img',
        content: 'a_img',
      },
      {
        sel: '#priceValue',
        parent: '#prodDetails',
        type: 'value',
        content: 'a_prc_test_1',
      },
      {
        sel: '#twister-plus-price-data-price',
        parent: '#twisterPlusPriceSubtotalWWDesktop_feature_div',
        type: 'value',
        content: 'a_prc_test_2',
      },
      {
        sel: '#twisterPlusWWDesktop > div',
        type: 'parse_json_element',
        content: 'a_prc_test_3',
        path: 'desktop_buybox_group_1[0].priceAmount',
      },
      {
        sel: 'span[id=productTitle]',
        parent: 'h1[id=title]',
        type: 'text',
        content: 'name',
      },
      {
        sel: 'span.a-offscreen',
        parent: 'div[id=corePrice_feature_div] span.a-price',
        type: 'text',
        content: 'a_prc',
      },
    ],
    categories: {
      sel: '',
      type: '',
      exclude: [],
      subCategories: [],
    },
    hasEan: true,
    productList: [
      {
        sel: 'span[data-component-type=s-search-results]',
        productCntSel: [],
        product: {
          sel: 'div[data-component-type=s-search-result]',
          type: 'container',
          details: [
            {
              content: 'link',
              sel: 'h2 a',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'img.s-image',
              type: 'src',
            },
            {
              content: 'prime',
              sel: 'i.a-icon-prime',
              type: 'exist',
            },
            {
              content: 'name',
              sel: 'h2 span',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div[data-cy=secondary-offer-recipe] span.a-color-base',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'span.a-price span.a-offscreen',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'mix',
    queryActions: [],
    queryUrlSchema: [
      {
        baseUrl: 'https://www.amazon.de/s?k=<query>&language=de_DE',
        category: 'default',
      },
    ],
    resourceTypes: {
      crawl: [
        // "media",
        // "font",
        // "stylesheet",
        // "other",
        // "image",
        // "xhr",
        // "fetch",
        // "script",
      ],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'actionsports.de': {
    actions: [],
    active: false,
    categories: {
      exclude: ['marken'],
      sel: 'div.navigation--list-wrapper ul.navigation--list li.navigation--entry a',
      type: 'href',
      subCategories: [
        {
          sel: 'ul.is--level1 a.navigation--link',
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'actionsports.de',
    entryPoints: [
      {
        url: 'https://www.actionsports.de',
        category: 'default',
      },
    ],
    manualCategories: [],
    mimic: 'a.logo--link img',
    hasEan: true,
    paginationEl: [
      {
        type: 'pagination',
        sel: 'div.listing--bottom-paging',
        nav: '?p=',
        calculation: {
          method: 'count',
          last: 'div.listing--bottom-paging span.paging--display',
          sel: 'div.listing--bottom-paging span.paging--display',
        },
      },
    ],
    productList: [
      {
        sel: 'div.sr-resultList',
        productsPerPage: 60,
        productCntSel: ['span.paging--display'],
        product: {
          sel: 'div.sr-resultList div.sr-resultItemTile',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'div.sr-resultItemLink a',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'div.sr-resultItemTile__imageSection img.sr-resultItemTile__image',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'div.sr-productSummary__title',
              type: 'text',
            },
            {
              content: 'description',
              sel: 'div.sr-productSummary__description',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.sr-detailedPriceInfo__price',
              type: 'text',
            },
          ],
        },
      },
      {
        sel: 'div.offerList',
        productsPerPage: 60,
        productCntSel: ['span.paging--display'],
        product: {
          sel: 'div.offerList a.offerList-itemWrapper',
          type: 'link',
          details: [
            {
              content: 'image',
              sel: 'img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'div.offerList-item-description-title',
              type: 'text',
            },
            {
              content: 'description',
              sel: 'span.description-part-one',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.offerList-item-priceMin',
              type: 'text',
            },
          ],
        },
      },
    ],
    product: [],
    proxyType: 'mix',
    queryActions: [
      {
        type: 'shadowroot-button',
        sel: 'aside[id=usercentrics-cmp-ui]',
        btn_sel: 'button[id=deny]',
        action: 'click',
        name: 'Deny "Marketing"',
        wait: false,
      },
    ],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: [
        'media',
        'font',
        'stylesheet',
        'ping',
        'image',
        'xhr',
        'fetch',

        'script',
        'other',
      ],
    },
    waitUntil: {
      product: 'domcontentloaded',
      entryPoint: 'domcontentloaded',
    },
  },
  'action.com': {
    actions: [],
    product: [],
    hasEan: true,
    active: false,
    categories: {
      exclude: [],
      sel: 'li[data-section-type=CategoryMenuItem] a',
      type: 'href',
      subCategories: [
        {
          sel: 'div[data-testid=grid-navigation-links] a',
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'action.com',
    entryPoints: [
      {
        url: 'https://www.action.com/de-de',
        category: 'default',
      },
    ],
    manualCategories: [],
    mimic: "nav[data-testid='top-menu'] a svg.h-6",
    paginationEl: [
      {
        type: 'pagination',
        sel: 'div[data-testid=grid-pagination-items-desktop]',
        nav: '?page=',
        calculation: {
          method: 'count',
          last: 'div[data-testid=grid-pagination-items-desktop] a',
          sel: 'div[data-testid=grid-pagination-items-desktop] a',
        },
      },
    ],
    productList: [
      {
        sel: 'div.sr-resultList',
        productsPerPage: 28,
        productCntSel: ['p.text-center.text-xs'],
        product: {
          sel: 'div.sr-resultList div.sr-resultItemTile',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'div.sr-resultItemLink a',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'div.sr-resultItemTile__imageSection img.sr-resultItemTile__image',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'div.sr-productSummary__title',
              type: 'text',
            },
            {
              content: 'description',
              sel: 'div.sr-productSummary__description',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.sr-detailedPriceInfo__price',
              type: 'text',
            },
          ],
        },
      },
      {
        sel: 'div.offerList',
        productsPerPage: 28,
        productCntSel: ['p.text-center.text-xs'],
        product: {
          sel: 'div.offerList a.offerList-itemWrapper',
          type: 'link',
          details: [
            {
              content: 'image',
              sel: 'img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'div.offerList-item-description-title',
              type: 'text',
            },
            {
              content: 'description',
              sel: 'span.description-part-one',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.offerList-item-priceMin',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'mix',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: [
        'media',
        'font',
        'stylesheet',
        'ping',
        'image',
        'xhr',
        'fetch',

        'script',
        'other',
      ],
    },
    waitUntil: {
      product: 'domcontentloaded',
      entryPoint: 'domcontentloaded',
    },
  },
  'babymarkt.de': {
    actions: [],
    active: true,
    categories: {
      exclude: ['mode', 'beratung'],
      sel: 'nav.navigation ul.navigation__list a.navigation__link',
      type: 'href',
      subCategories: [
        {
          sel: 'ul.sidemenu__category-list a',
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'babymarkt.de',
    entryPoints: [
      {
        url: 'https://www.babymarkt.de',
        category: 'default',
      },
    ],
    hasEan: true,
    manualCategories: [],
    mimic: 'svg.svg-babymarkt-logo',
    paginationEl: [
      {
        type: 'pagination',
        sel: 'div.pagination__select-wrapper',
        nav: '?page=',
        calculation: {
          method: 'count',
          last: 'div.pagination__select-wrapper option',
          sel: 'div.pagination__select-wrapper option',
        },
      },
    ],
    pauseOnProductPage: {
      pause: true,
      min: 800,
      max: 900,
    },
    product: [
      {
        sel: "script[type='text/javascript']",
        parent: 'html',
        multiple: true,
        type: 'parse_json_element',
        content: 'ean',
        regexp: 'bbm.data.product.ean\\s+=\\s+"(\\d+)"',
      },
      {
        sel: 'div[id=info]',
        parent: 'body',
        type: 'parse_json_element',
        content: 'ean',
        path: 'ean',
      },
      {
        sel: 'div[id=info]',
        parent: 'body',
        type: 'parse_json_element',
        content: 'ean',
        path: 'gtin13',
      },
      {
        sel: 'div[id=info]',
        parent: 'body',
        type: 'parse_json_element',
        content: 'ean',
        path: 'gtin12',
      },
      {
        sel: 'div[id=info]',
        parent: 'body',
        type: 'parse_json_element',
        content: 'sku',
        path: 'id',
      },
      {
        sel: "script[type='text/javascript']",
        parent: 'html',
        multiple: true,
        type: 'parse_json_element',
        content: 'sku',
        regexp: 'bbm.data.product.sku\\s+=\\s+"(\\w+)"',
      },
      {
        sel: 'div[id=info]',
        parent: 'body',
        type: 'parse_json_element',
        content: 'instock',
        path: 'availability',
      },
      {
        sel: "script[type='text/javascript']",
        parent: 'html',
        multiple: true,
        type: 'parse_json_element',
        content: 'instock',
        regexp: 'bbm.data.product.availability\\s+=\\s+"(\\w+)"',
      },
      {
        sel: 'div[id=info]',
        parent: 'body',
        type: 'parse_json_element',
        content: 'price',
        path: 'price',
      },
      {
        sel: "script[type='text/javascript']",
        parent: 'html',
        multiple: true,
        type: 'parse_json_element',
        content: 'price',
        regexp: 'bbm.data.product.price\\s+=\\s+((\\w+.\\w+)|\\w+)',
      },
    ],
    productList: [
      {
        sel: 'div.row div.col-sm-9',
        productCntSel: ['span.list-products-count'],
        product: {
          sel: 'a.product__link',
          type: 'link',
          details: [
            {
              content: 'image',
              sel: 'article.product img',
              type: 'data-src',
            },
            {
              content: 'mnfctr',
              sel: 'article.product div.product__brand',
              type: 'text',
            },
            {
              content: 'name',
              sel: 'article.product p.product__title',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'article.product div.product__price:is(:nth-child(2), :nth-child(3))',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'mix',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: [
        'media',
        'font',
        'stylesheet',
        'ping',
        'image',
        'xhr',
        'fetch',

        'other',
      ],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'bergfreunde.de': {
    actions: [],
    active: true,
    categories: {
      exclude: ['anzeigen'],
      visible: false,
      sel: 'a.level-1-link',
      type: 'href',
      subCategories: [
        {
          visible: false,
          sel: 'div.list-box a.cat-title-link',
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'bergfreunde.de',
    entryPoints: [
      {
        url: 'https://www.bergfreunde.de',
        category: 'default',
      },
    ],
    exceptions: [
      'https://www.bergfreunde.de/out/pictures/img/bergfreunde-logo.png',
    ],
    hasEan: true,
    manualCategories: [],
    mimic: "a[data-mapp-click='header.logo'] img",
    paginationEl: [
      {
        type: 'pagination',
        sel: 'div.paging',
        nav: '',
        calculation: {
          method: 'count',
          last: 'div.paging a',
          sel: 'div.paging a',
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
        type: 'parse_json_element',
        content: 'price',
        multiple: true,
        parent: 'div[id=details]',
        path: 'offers.price',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'instock',
        multiple: true,
        parent: 'div[id=details]',
        path: 'offers.availability',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        multiple: true,
        parent: 'div[id=details]',
        path: 'gtin13',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'sku',
        multiple: true,
        parent: 'div[id=details]',
        path: 'sku',
      },
      {
        parent: 'li[itemprop=associatedMedia]',
        sel: 'img',
        type: 'src',
        content: 'image',
      },
    ],
    productList: [
      {
        sel: 'ul[id=product-list]',
        productCntSel: ['div.product-amount'],
        product: {
          sel: 'ul[id=product-list] a.product-link',
          type: 'link',
          details: [
            {
              content: 'image',
              sel: 'img.product-image',
              baseUrl:
                'https://www.bfgcdn.com/out/pictures/generated/product/1/',
              regexp: '(\\d+)_215_90\\/(.*?)\\s',
              type: 'srcset',
            },
            {
              content: 'name',
              sel: 'ul[id=product-list] a.product-link div.product-infobox',
              type: 'text',
            },
            {
              content: 'description',
              sel: 'div.sr-productSummary__description',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.product-price span[data-codecept=currentPrice]',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'mix',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: ['media', 'font', 'ping', 'image', 'xhr', 'fetch', 'other'],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'cyberport.de': {
    actions: [],
    active: true,
    categories: {
      exclude: [
        'service-garantien',
        'content-creator',
        'tech-week',
        'nfl.html',
        'lexikon',
        'newsletter',
        'digitales-lernen',
        'kaufberatung',
        'software',
        'gutscheine',
        'abo',
        'zurueck',
        'konfiguration',
        'service',
        'zurück',
        'stores',
        'kontakt',
        'einstellungen',
        'tipps zum stöbern',
        'newsletter',
      ],
      sel: '#top > header > div.mainNavigation > div > div:nth-child(1) > div > div > nav > ul > li.nav-main-primary.nav-main-md-plus-devices > ul > li > a',
      type: 'href',
      subCategories: [
        {
          visible: false,
          sel: 'div.sidebarNavigationBox ul li:is(.levelFirst) > a',
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'cyberport.de',
    entryPoints: [
      {
        url: 'https://www.cyberport.de',
        category: 'default',
      },
    ],
    hasEan: false,
    manualCategories: [],
    mimic: 'svg.cpHeaderLogo__svg',
    paginationEl: [
      {
        type: 'pagination',
        sel: 'div.paging',
        nav: '?p=',
        calculation: {
          method: 'count',
          last: 'div.paging a',
          sel: 'div.paging a',
        },
      },
    ],
    product: [
      {
        parent: 'div.productOmnibox-availability__delivery',
        sel: 'a[href="#overlayDeliveryAvailability"]',
        type: 'text',
        content: 'instock',
      },
      {
        parent: 'div.productOmnibox-price',
        sel: 'span.productOmnibox-price__price--delivery',
        type: 'text',
        content: 'price',
      },
    ],
    productList: [
      {
        sel: 'div.productsList',
        productCntSel: ['span.resultCount'],
        product: {
          sel: 'div.productsList article.productArticle',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a.head.heading-level3',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'div.productImage img',
              type: 'srcset',
            },
            {
              content: 'name',
              sel: 'h3.productTitleName',
              type: 'text',
            },
            {
              content: 'description',
              sel: 'div[class=productinfobox] ul',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.delivery-price',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'de',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: [
        'media',
        'font',
        'stylesheet',
        'ping',
        'image',
        'xhr',
        'fetch',

        'script',
        'other',
      ],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'conrad.de': {
    actions: [],
    allowedHosts: ['api.conrad.de', 'api-cdn.conrad.com'],
    active: true,
    categories: {
      exclude: ['software', 'refurbished-produkte'],
      sel: 'ul.cmsMenuCategory__list a.cmsMenuCategory__link',
      type: 'href',
      visible: false,
      regexpMatchIndex: 0,
      categoryRegexp: '(\\w+-\\w+-\\d+|\\w+-\\d+|(\\w+).html)',
      subCategories: [
        {
          visible: false,
          sel: 'div.cmsMainCategory__list a',
          type: 'href',
        },
        {
          visible: false,
          sel: 'a[data-track-wtac*=cp_sale_kategorien]',
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    csp: false,
    d: 'conrad.de',
    entryPoints: [
      {
        url: 'https://www.conrad.de',
        category: 'default',
      },
    ],
    hasEan: true,
    javascript: {
      sharedWorker: 'enabled',
      webWorker: 'enabled',
      serviceWorker: 'enabled',
    },
    manualCategories: [],
    mimic: 'li.cmsHeaderMain__item svg.cmsLogo__base',
    paginationEl: [
      {
        type: 'pagination',
        sel: 'aside.pagination-block',
        nav: '?page=',
        calculation: {
          method: 'product_count',
          productsPerPage: 30,
          last: 'aside.pagination-block li a',
          sel: 'aside.pagination-block li a',
        },
      },
    ],
    pauseOnProductPage: {
      pause: true,
      min: 2000,
      max: 4000,
    },
    product: [
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        path: 'gtin12',
        multiple: true,
        parent: 'div[id=product-app-container]',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        path: 'gtin13',
        multiple: true,
        parent: 'div[id=product-app-container]',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'sku',
        path: 'sku',
        multiple: true,
        parent: 'div[id=product-app-container]',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'instock',
        path: 'offers.availability',
        multiple: true,
        parent: 'div[id=product-app-container]',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'price',
        path: 'offers.price',
        multiple: true,
        parent: 'div[id=product-app-container]',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'price',
        path: 'offers.priceSpecification.price',
        multiple: true,
        parent: 'div[id=product-app-container]',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'name',
        path: 'name',
        multiple: true,
        parent: 'div[id=product-app-container]',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'image',
        path: 'image',
        multiple: true,
        parent: 'div[id=product-app-container]',
      },
    ],
    productList: [
      {
        sel: 'div.resultsListLayout',
        productCntSel: ['span[id=totalResultCount]'],
        awaitProductCntSel: true,
        product: {
          sel: 'div.tableLayout__row',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a.product__title',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'a.product__imageLink img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'a.product__title',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'p.product__currentPrice',
              type: 'text',
            },
          ],
        },
      },
      {
        sel: 'div[id=skiplink-main] div.columncontrol',
        productCntSel: ['span[id=totalResultCount]'],
        awaitProductCntSel: true,
        product: {
          sel: 'div[id=skiplink-main] div.columncontrol li.cmsRecommendation__teaserList__item',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a.cmsRecommendation__teaserList__link',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'img.cmsRecommendation__teaserList__image',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'div.cmsRecommendation__teaserList__title',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.price',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'mix',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: ['media', 'font', 'image'],
      product: [
        'media',
        'font',
        'image',
        'xhr',
        'other',
        'ping',
        'fetch',
        'preflight',
        'prefetch',
      ],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'coolshop.de': {
    actions: [],
    allowedHosts: ['webshop.coolshop-cdn.com'],
    active: true,
    categories: {
      exclude: ['software'],
      sel: 'div.main-navigation li a.first-level-link',
      type: 'href',
      subCategories: [
        {
          sel: 'div[id=categoryList] li.search-categories__item a',
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'coolshop.de',
    entryPoints: [
      {
        url: 'https://www.coolshop.de',
        category: 'default',
      },
    ],
    hasEan: true,
    manualCategories: [
      {
        link: 'https://www.coolshop.de/videospiele-und-konsolen/',
        name: 'Spiele und Konsolen',
      },
      {
        link: 'https://www.coolshop.de/spielzeug/',
        name: 'Spielzeug',
      },
      {
        link: 'https://www.coolshop.de/schoenheit/',
        name: 'Schönheit',
      },
      {
        link: 'https://www.coolshop.de/haustier-zubehoer/',
        name: 'Haustier Zubehör',
      },
      {
        link: 'https://www.coolshop.de/haushalt-und-kuche/',
        name: 'Haushalt und Küche',
      },
      {
        link: 'https://www.coolshop.de/elektronikteile/',
        name: 'Elektronikteile',
      },
      {
        link: 'https://www.coolshop.de/computer/',
        name: 'Computer',
      },
      {
        link: 'https://www.coolshop.de/werkzeuge-und-wohnraumverbesserungen/',
        name: 'Werkzeuge',
      },
      {
        link: 'https://www.coolshop.de/babys-und-kinder/',
        name: 'Babys und Kinder',
      },
      {
        link: 'https://www.coolshop.de/gesundheit-und-koerperpflege/',
        name: 'Gesundheit und Körperpflege',
      },
      {
        link: 'https://www.coolshop.de/gadgets/',
        name: 'Gadgets',
      },
      {
        link: 'https://www.coolshop.de/fan-shop-und-fanartikel/',
        name: 'Fan-Shop und Fanartikel',
      },
      {
        link: 'https://www.coolshop.de/sport-und-outdoor/',
        name: 'Sport und outdoor',
      },
      {
        link: 'https://www.coolshop.de/garten-hof-und-aussenbereich/',
        name: 'Garten',
      },
    ],
    mimic: 'div.header-logo picture',
    paginationEl: [
      {
        type: 'scroll-and-click',
        sel: 'button[id=searchLoadMoreButton]',
        endOfPageSel: 'div[id=noMoreCard]',
        wait: false,
        findPaginationStrategy: 'estimate',
        visible: false,
        nav: '?page=',
        calculation: {
          method: 'estimate',
          productsPerPage: 21,
          textToMatch: 'Mehr anzeigen',
          dynamic: true,
          last: 'button[id=searchLoadMoreButton]',
          sel: 'button[id=searchLoadMoreButton]',
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
        type: 'parse_json_element',
        content: 'ean',
        path: 'hasVariant[0].gtin',
        multiple: true,
        parent: 'div[id=container]',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        path: 'hasVariant[0].gtin13',
        multiple: true,
        parent: 'div[id=container]',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'sku',
        path: 'hasVariant[0].sku',
        multiple: true,
        parent: 'div[id=container]',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'instock',
        path: 'hasVariant[0].offers.offers[0].availability',
        multiple: true,
        parent: 'div[id=container]',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'price',
        path: 'hasVariant[0].offers.lowPrice',
        multiple: true,
        parent: 'div[id=container]',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'name',
        path: 'name',
        multiple: true,
        parent: 'div[id=container]',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'image',
        path: 'hasVariant[0].image',
        multiple: true,
      },
    ],
    productList: [
      {
        sel: 'div[id=searchResults]',
        productCntSel: ['div.header-count'],
        product: {
          sel: 'article.product__card',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a.product__card-link',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'figure img',
              type: 'srcset',
            },
            {
              content: 'name',
              sel: 'h3.product__card-title',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.product__card-price',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'mix',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: ['media', 'font', 'ping', 'image', 'other'],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'costway.de': {
    actions: [],
    active: false,
    categories: {
      exclude: ['alle'],
      sel: 'a.top-nav',
      type: 'href',
      subCategories: [
        {
          sel: 'div.catalog-sub-menu div.ant-col a',
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'costway.de',
    entryPoints: [
      {
        url: 'https://www.costway.de',
        category: 'default',
      },
    ],
    manualCategories: [
      {
        name: 'Mega Woche',
        link: 'https://www.costway.de/mega-woche?entrypoint=hotwords',
      },
      {
        name: 'Ausverkauf',
        link: 'https://www.costway.de/ausverkauf?entrypoint=hotwords',
      },
    ],
    mimic: "img[title='COSTWAY']",
    paginationEl: [
      {
        type: 'pagination',
        sel: 'div.pages',
        nav: '?p=',
        calculation: {
          method: 'count',
          dynamic: true,
          last: 'div.pages li.item a.page',
          sel: 'div.pages li.item a.page',
        },
      },
    ],
    productList: [
      {
        sel: 'div.products-grid',
        productCntSel: [
          'ul.items.pages-items li:not(.page-item-next):nth-last-child(2)',
        ],
        product: {
          sel: 'div.products-grid li.product-item',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'div.imgage-box a',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'div.imgage-box img',
              type: 'data-original',
            },
            {
              content: 'name',
              proprietaryProducts: 'COSTWAY',
              sel: 'a.product-item-link',
              type: 'title',
            },
            {
              content: 'price',
              sel: 'span.price',
              type: 'text',
            },
          ],
        },
      },
      {
        sel: 'div.seemore-fivelist',
        productCntSel: [
          'ul.items.pages-items li:not(.page-item-next):nth-last-child(2)',
        ],
        product: {
          sel: 'div.seemore-fivelist li.pro_sku',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a.pro_link',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'img.pro_img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'p.productText',
              proprietaryProducts: 'COSTWAY',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'span.now-price',
              type: 'text',
            },
          ],
        },
      },
    ],
    product: [],
    hasEan: true,
    proxyType: 'mix',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: [
        'media',
        'font',
        'stylesheet',
        'ping',
        'image',
        'xhr',
        'fetch',

        'script',
        'other',
      ],
    },
    waitUntil: {
      product: 'domcontentloaded',
      entryPoint: 'domcontentloaded',
    },
  },
  'digitalo.de': {
    actions: [],
    active: true,
    categories: {
      exclude: [],
      sel: 'div[id=cMaincat] ul:nth-of-type(2) a',
      type: 'href',
      subCategories: [
        {
          sel: 'section[id=main_content] div.grid_container a.category__box__panel__list__item',
          type: 'href',
          visible: false,
        },
      ],
    },
    crawlActions: [],
    d: 'digitalo.de',
    entryPoints: [
      {
        url: 'https://www.digitalo.de',
        category: 'default',
      },
    ],
    manualCategories: [
      {
        name: 'Computer',
        link: 'https://www.digitalo.de/categories/10990/Computer.html',
      },
      {
        name: 'Multimedia',
        link: 'https://www.digitalo.de/categories/10991/Multimedia.html',
      },
      {
        name: 'TV & Audio',
        link: 'https://www.digitalo.de/categories/8175/TV-Audio.html',
      },
      {
        name: 'Haus & Garten',
        link: 'https://www.digitalo.de/categories/8176/Haus-Garten.html',
      },
      {
        name: 'Outdoor & Freizeit',
        link: 'https://www.digitalo.de/categories/8177/Outdoor-Freizeit.html',
      },
      {
        name: 'Baumarkt',
        link: 'https://www.digitalo.de/categories/8178/Baumarkt.html',
      },
      {
        name: 'Batterie & Kabel',
        link: 'https://www.digitalo.de/categories/8179/Batterien-Kabel.html',
      },
      {
        name: 'Sales',
        link: 'https://www.digitalo.de/categories/8177_8259/Outdoor-Freizeit/Sale.html',
      },
      {
        name: 'Sales',
        link: 'https://www.digitalo.de/products/dailydeals.html?itm_source=info&itm_medium=deals_block&itm_campaign=goToDealsPage',
      },
    ],
    mimic: 'div.head__wrapper svg.icon_logo_shop',
    paginationEl: [
      {
        type: 'pagination',
        sel: 'div[id=js_search_pagination_bottom]',
        nav: '?page=',
        calculation: {
          method: 'match_text',
          textToMatch: 'Weitere Produkte anzeigen',
          dynamic: true,
          last: 'div[id=js_search_pagination_bottom] button',
          sel: 'div[id=js_search_pagination_bottom] button',
        },
      },
    ],
    productList: [
      {
        sel: 'div[id=js_search_content]',
        productCntSel: [],
        product: {
          sel: 'div.search_results__result__content',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a.product__title',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'a.product__image img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'a.product__title',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div[class*=product__price__wrapper]',
              type: 'text',
            },
          ],
        },
      },
      {
        sel: 'div.dailydeal',
        productCntSel: [],
        product: {
          sel: 'a.deal__link',
          type: 'link',
          details: [
            {
              content: 'image',
              sel: 'img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'span[class*=product__title]',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div[class*=product__price__wrapper]',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'de',
    hasEan: true,
    product: [
      {
        sel: 'div.product__shipping__availability',
        parent: 'section[id=main_content]',
        type: 'text',
        content: 'instock',
      },
      {
        sel: 'div[class*=product__price__wrapper]',
        parent: 'section[id=main_content]',
        type: 'text',
        content: 'price',
      },
      {
        sel: 'meta[itemprop=gtin]',
        parent: 'section[id=main_content]',
        type: 'content',
        content: 'ean',
      },
      {
        sel: 'h1[id=js_heading]',
        parent: 'section[id=main_content]',
        content: 'name',
        type: 'text',
      },
      {
        sel: 'div[id=buybox_top] img',
        parent: 'section[id=main_content]',
        type: 'src',
        content: 'image',
      },
    ],
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: [
        'media',
        'font',
        'stylesheet',
        'ping',
        'image',
        'xhr',
        'fetch',

        'script',
        'other',
      ],
    },
    waitUntil: {
      product: 'domcontentloaded',
      entryPoint: 'domcontentloaded',
    },
  },
  'dm.de': {
    actions: [],
    active: true,
    allowedHosts: [
      'product-search.services.dmtech.com',
      'assets.dm.de',
      'products.dm.de',
      'content.services.dmtech.com',
    ],
    categories: {
      exclude: ['marken'],
      sel: 'nav[id=categoryNavigationContainer] a',
      visible: false,
      type: 'href',
      subCategories: [
        {
          sel: 'a[data-dmid=on-page-navigation-item]',
          visible: false,
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'dm.de',
    ean: 'p[0-9]{11,13}',
    entryPoints: [
      {
        url: 'https://www.dm.de',
        category: 'default',
      },
    ],
    hasEan: false,
    manualCategories: [],
    mimic: 'div[data-dmid=upper-header-container];',
    paginationEl: [
      {
        type: 'recursive-more-button',
        sel: 'button[data-dmid=load-more-products-button]',
        nav: '?currentPage0=',
        wait: false,
        calculation: {
          method: 'match_text',
          textToMatch: 'Mehr laden',
          dynamic: true,
          last: 'button[data-dmid=load-more-products-button]',
          sel: 'button[data-dmid=load-more-products-button]',
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
        type: 'parse_json_element',
        content: 'price',
        path: 'offers.price',
        multiple: true,
        parent: 'head',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'instock',
        path: 'offers.availability',
        multiple: true,
        parent: 'head',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        path: 'gtin',
        multiple: true,
        parent: 'head',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'sku',
        path: 'sku',
        multiple: true,
        parent: 'head',
      },
    ],
    productList: [
      {
        sel: 'div[data-dmid=product-grid-container]',
        productCntSel: ['span[data-dmid=total-count]'],
        awaitProductCntSel: true,
        product: {
          sel: 'div[data-dmid=product-grid-container] div[data-dmid=product-tile-container]',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a[class*=pdd_]',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'img[class*=pdd_]',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'div[data-dmid=product-description] a',
              type: 'text',
            },
            {
              content: 'mnfctr',
              sel: 'span[data-dmid=product-brand]',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'span[data-dmid=price-localized]',
              type: 'text',
            },
          ],
        },
      },
      {
        sel: 'div.offerList',
        productCntSel: ['span[data-dmid=total-count]'],
        product: {
          sel: 'div.offerList a.offerList-itemWrapper',
          type: 'link',
          details: [
            {
              content: 'image',
              sel: 'img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'div.offerList-item-description-title',
              type: 'text',
            },
            {
              content: 'description',
              sel: 'span.description-part-one',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.offerList-item-priceMin',
              type: 'text',
            },
          ],
        },
      },
    ],
    // javascript: {
    //   sharedWorker: 'enabled',
    //   webWorker: 'enabled',
    //   serviceWorker: 'enabled',
    //   webSocket: 'enabled',
    // },
    proxyType: 'mix',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: ['media', 'font', 'image'],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'ebay.de': {
    active: true,
    d: 'ebay.de',
    entryPoints: [
      {
        url: 'https://www.ebay.de',
        category: 'default',
      },
    ],
    categories: {
      sel: '',
      type: '',
      exclude: [],
      subCategories: [],
    },
    mimic: 'div.gh-header__logo-cats-wrap a',
    paginationEl: [],
    productList: [
      {
        sel: 'ul.srp-results',
        productCntSel: [],
        product: {
          sel: 'ul.srp-results li.s-item',
          type: 'container',
          details: [
            {
              content: 'link',
              sel: 'div.s-item__info a',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'div.s-item__image-wrapper img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'div.s-item__title span[role=heading]',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'span.s-item__price',
              type: 'text',
            },
          ],
        },
      },
    ],
    crawlActions: [],
    hasEan: false,
    proxyType: 'mix',
    queryActions: [],
    product: [
      {
        sel: "div[data-testid=x-about-this-item] div[data-testid='ux-layout-section-evo__item']",
        head: 'dt',
        row: 'dd',
        type: 'table',
        keys: ['ean', 'upc', 'gtin', 'gtin13', 'gtin11'],
        content: 'ean',
      },
      {
        sel: 'div[id=ProductDetails]',
        head: 'div.s-name',
        row: 'div.s-value',
        type: 'table',
        keys: ['ean', 'upc', 'gtin', 'gtin13', 'gtin11'],
        content: 'ean',
      },
      {
        sel: 'span.ux-textspans',
        parent: 'h1.x-item-title__mainTitle',
        type: 'text',
        content: 'name',
      },
      {
        sel: 'img',
        parent: 'div.ux-image-carousel-item',
        type: 'src',
        content: 'image',
      },
      {
        sel: 'span',
        parent: 'div.vim.d-statusmessage',
        content: 'instock',
        type: 'text',
      },
      {
        sel: 'span',
        parent: 'div.vim.x-alert',
        content: 'instock',
        type: 'text',
      },
      {
        parent: 'div.seo-breadcrumbs-container',
        sel: 'li',
        listItemInnerSel: 'a',
        type: 'list',
        content: 'categories',
        listItemType: 'href',
      },
      {
        parent: 'div[id=mainContent]',
        sel: 'div.x-price-primary span.ux-textspans',
        content: 'e_prc',
        type: 'text',
      },
    ],
    queryUrlSchema: [
      {
        baseUrl:
          'https://www.ebay.de/sch/i.html?_fsrp=1&rt=nc&_from=R40&_nkw=<query>&_sacat=0&LH_BIN=1&LH_ItemCondition=3&LH_SellerType=2&LH_PrefLoc=3&LH_Sold=1&LH_Complete=1&_udhi=<price>',
        category: 'default',
      },
      {
        baseUrl:
          'https://www.ebay.de/sch/i.html?_fsrp=1&rt=nc&_from=R40&LH_PrefLoc=3&LH_ItemCondition=3&LH_Complete=1&LH_Sold=1&_nkw=<query>&_sacat=0&LH_BIN=1&_udhi=<price>',
        category: 'sold_products',
      },
      {
        baseUrl:
          'https://www.ebay.de/sch/i.html?_fsrp=1&rt=nc&_from=R40&LH_PrefLoc=3&LH_ItemCondition=3&_nkw=<query>&_sacat=0&LH_BIN=1&_udhi=<price>',
        category: 'total_listings',
      },
    ],
    resourceTypes: {
      crawl: [
        'media',
        'font',
        'stylesheet',
        'ping',
        'image',
        'other',
        'xhr',
        'fetch',
        'script',
      ],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'euronics.de': {
    actions: [],
    active: false,
    allowedHosts: ['cdn.euronics.de'],
    ean: '-[0-9]{11,13}',
    categories: {
      exclude: ['marken'],
      sel: 'ul.main-categories li a',
      visible: false,
      type: 'href',
      subCategories: [
        {
          sel: 'ul.sidebar--navigation li.navigation--entry a.navigation--link.link--go-forward:first-child',
          visible: false,
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'euronics.de',
    entryPoints: [
      {
        url: 'https://www.euronics.de',
        category: 'default',
      },
    ],
    hasEan: true,
    manualCategories: [],
    mimic: 'div.logo--shop picture',
    paginationEl: [
      {
        type: 'pagination',
        nav: '?p=',
        wait: false,
        sel: 'div[class=listing][data-pages]',
        calculation: {
          method: 'element_attribute',
          attribute: 'data-pages',
        },
      },
      {
        type: 'pagination',
        sel: 'div.listing--paging',
        nav: '?p=',
        wait: false,
        calculation: {
          method: 'find_highest',
          dynamic: true,
          last: 'div.listing--paging span.paging--display',
          sel: 'div.listing--paging span.paging--display',
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
        type: 'parse_json_element',
        content: 'price',
        path: 'offers.price',
        multiple: true,
        parent: 'body',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'instock',
        path: 'offers.availability',
        multiple: true,
        parent: 'body',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        path: 'gtin',
        multiple: true,
        parent: 'body',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'image',
        path: 'image',
        multiple: true,
        parent: 'body',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'name',
        path: 'name',
        multiple: true,
        parent: 'body',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'sku',
        path: 'sku',
        multiple: true,
        parent: 'body',
      },
    ],
    productList: [
      {
        sel: 'div.listing--container',
        productCntSel: [],
        awaitProductCntSel: true,
        product: {
          sel: 'div.product--info',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a.product--title',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'a.product--image img',
              type: 'srcset',
            },
            {
              content: 'name',
              sel: 'a.product--title',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'span[data-track-id]',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'de',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      product: ['media', 'font', 'ping', 'image', 'other'],
      crawl: [
        'media',
        'font',
        'stylesheet',
        'ping',
        'image',
        'xhr',
        'fetch',
        'script',
        'other',
      ],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'flaconi.de': {
    actions: [],
    active: true,
    categories: {
      exclude: ['magazin', 'premium', 'geschenkgutschein', 'marken'],
      sel: 'ul[class*=Navigationstyle__List] li[class*=Navigationstyle__ListItem] > a',
      type: 'href',
      subCategories: [
        {
          sel: 'div[class*=SideNavstyle__DefaultContainer] li[class*=SideNavstyle__Element] a',
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'flaconi.de',
    entryPoints: [
      {
        url: 'https://www.flaconi.de',
        category: 'default',
      },
    ],
    hasEan: true,
    manualCategories: [],
    mimic:
      'div[id=Mainheader] a[class*=Mainheaderstyle__LogoLink] div[class*=Common__DesktopContainer] svg;',
    paginationEl: [
      {
        type: 'pagination',
        sel: 'div[class*=Paginationstyle__PaginationWrapper]',
        nav: '?offset=<page>',
        paginationUrlSchema: {
          calculation: {
            offset: 24,
            method: 'offset',
          },
          replace: 'attach_end',
        },
        calculation: {
          method: 'product_count',
          productsPerPage: 24,
          last: 'div[class*=Paginationstyle__PaginationWrapper] div[class*=Paginationstyle__Pages]',
          sel: 'div[class*=Paginationstyle__PaginationWrapper] div[class*=Paginationstyle__Pages]',
        },
      },
    ],
    pauseOnProductPage: {
      pause: true,
      min: 700,
      max: 900,
    },
    product: [
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        path: 'gtin12',
        multiple: true,
        parent: 'html',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        path: 'gtin13',
        multiple: true,
        parent: 'html',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'sku',
        path: 'sku',
        multiple: true,
        parent: 'html',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'instock',
        path: 'offers[0].availability',
        multiple: true,
        parent: 'html',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'price',
        path: 'offers[0].price',
        multiple: true,
        parent: 'html',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'name',
        path: 'name',
        multiple: true,
        parent: 'html',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'image',
        path: 'image',
        multiple: true,
        parent: 'html',
      },
    ],
    productList: [
      {
        sel: 'div[data-qa-block=product-section]',
        productCntSel: ['span[class*=CatalogCountTitlestyle__CatalogCount]'],
        product: {
          sel: 'div[data-product-list-id*=list]',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'img',
              type: 'srcset',
            },
            {
              content: 'mnfctr',
              sel: 'span[data-qa-block=product-brand]',
              type: 'text',
            },
            {
              content: 'name',
              sel: 'span[data-qa-block=product_series]',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'span[data-qa-block=product_price]',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'mix',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: [
        'media',
        'font',
        'stylesheet',
        'ping',
        'image',
        'xhr',
        'fetch',

        'script',
        'other',
      ],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'lyko.com': {
    actions: [],
    active: true,
    categories: {
      exclude: [
        'magazine',
        'wir-sind-lyko',
        'club lyko',
        'skandinavische-marken',
        'geschenkgutschein',
        'marken',
      ],
      sel: '',
      type: 'href',
      subCategories: [
        {
          sel: 'a[appearance=gallery]',
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'lyko.com',
    entryPoints: [
      {
        url: 'https://www.lyko.com/de',
        category: 'default',
      },
    ],
    exceptions: [
      'https://lyko.com/favicons/logoicon_192.png',
      'https://lyko.com/manifest',
    ],
    hasEan: true,
    manualCategories: [
      {
        name: 'Hautpflege',
        link: 'https://lyko.com/de/hautpflege',
      },
      {
        name: 'dermatologische-hautpflege',
        link: 'https://lyko.com/de/hautpflege/dermatologische-hautpflege',
      },
      {
        name: 'Haar',
        link: 'https://lyko.com/de/haar',
      },
      {
        link: 'https://lyko.com/de/makeup',
        name: 'Makeup',
      },
      {
        link: 'https://lyko.com/de/dufte',
        name: 'Duefte',
      },
      {
        link: 'https://lyko.com/de/lifestyle-mehr/k-beauty',
        name: 'K-Beauty',
      },
      {
        link: 'https://lyko.com/de/gesundheit-wellness',
        name: 'Gesundheit & Wellness',
      },
      {
        link: 'https://lyko.com/de/lifestyle-mehr',
        name: 'Lifestyle & Mehr',
      },
      {
        link: 'https://lyko.com/de/mann',
        name: 'Mann',
      },
      {
        link: 'https://lyko.com/de/dufte',
        name: 'Duefte',
      },
      {
        link: 'https://lyko.com/de/lifestyle-mehr/premium',
        name: 'Duefte',
        skipSubCategories: true,
      },
    ],
    mimic: 'a[aria-label="Lyko startsida"]',
    paginationEl: [
      {
        type: 'scroll-and-extract',
        sel: "#product-listing > div:nth-child(1) button[appearance='primary,large,outlined']",
        nav: '?offset=<page>',
        paginationUrlSchema: {
          calculation: {
            offset: 24,
            method: 'offset',
          },
          replace: 'attach_end',
        },
        calculation: {
          method: 'product_count',
          productsPerPage: 24,
          last: "#product-listing > div:nth-child(1) button[appearance='primary,large,outlined']",
          sel: "#product-listing > div:nth-child(1) button[appearance='primary,large,outlined']",
        },
      },
    ],
    pauseOnProductPage: {
      pause: true,
      min: 700,
      max: 900,
    },
    product: [
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        path: 'gtin12',
        multiple: true,
        parent: 'html',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        path: 'gtin13',
        multiple: true,
        parent: 'html',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'sku',
        path: 'sku',
        multiple: true,
        parent: 'html',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'instock',
        path: 'offers.availability',
        multiple: true,
        parent: 'html',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'price',
        path: 'offers.price',
        multiple: true,
        parent: 'html',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'name',
        path: 'name',
        multiple: true,
        parent: 'html',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'image',
        path: 'image',
        multiple: true,
        parent: 'html',
      },
    ],
    productList: [
      {
        sel: '#product-listing > div:nth-child(1)',
        productCntSel: ['#product-listing > div:nth-child(2) > div'],
        product: {
          sel: '#product-listing div.ReactVirtualized__Grid__innerScrollContainer div > div[data-buyable-variant-code]',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'div:nth-child(1) > a',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'h5',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'a[data-scope-link] > span:nth-child(1) > span:nth-child(1) span',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'mix',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: ['media', 'font', 'image', 'other'],
      product: [
        'media',
        'font',
        'stylesheet',
        'ping',
        'image',
        'xhr',
        'fetch',
        'script',
        'other',
      ],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'fahrrad.de': {
    actions: [],
    active: false,
    categories: {
      exclude: ['aktivitäten', 'marken', 'service & beratung'],
      sel: 'ul.menu-category li.li-level-1 a.a-level-1',
      type: 'href',
      subCategories: [
        {
          sel: 'div[id=newcategorychips] a',
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'fahrrad.de',
    entryPoints: [
      {
        url: 'https://www.fahrrad.de',
        category: 'default',
      },
    ],
    manualCategories: [],
    mimic: 'a.logo',
    hasEan: true,
    paginationEl: [
      {
        type: 'pagination',
        sel: 'ul.pagination__list',
        nav: '?page=',
        calculation: {
          method: 'count',
          last: 'ul.pagination__list a',
          sel: 'ul.pagination__list a',
        },
      },
    ],
    productList: [
      {
        sel: 'div.sr-resultList',
        productCntSel: ['span.js-articleAmount'],
        product: {
          sel: 'div.sr-resultList div.sr-resultItemTile',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'div.sr-resultItemLink a',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'div.sr-resultItemTile__imageSection img.sr-resultItemTile__image',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'div.sr-productSummary__title',
              type: 'text',
            },
            {
              content: 'description',
              sel: 'div.sr-productSummary__description',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.sr-detailedPriceInfo__price',
              type: 'text',
            },
          ],
        },
      },
      {
        sel: 'div.offerList',
        productCntSel: ['span.js-articleAmount'],
        product: {
          sel: 'div.offerList a.offerList-itemWrapper',
          type: 'link',
          details: [
            {
              content: 'image',
              sel: 'img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'div.offerList-item-description-title',
              type: 'text',
            },
            {
              content: 'description',
              sel: 'span.description-part-one',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.offerList-item-priceMin',
              type: 'text',
            },
          ],
        },
      },
    ],
    product: [],
    proxyType: 'mix',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: [
        'media',
        'font',
        'stylesheet',
        'ping',
        'image',
        'xhr',
        'fetch',

        'script',
        'other',
      ],
    },
    waitUntil: {
      product: 'domcontentloaded',
      entryPoint: 'domcontentloaded',
    },
  },
  'fressnapf.de': {
    actions: [],
    active: true,
    allowedHosts: ['fressnapf.app.baqend.com', 'api.os.fressnapf.com'],
    categories: {
      exclude: ['service', 'magazin'],
      sel: 'div[data-qa-id=__navigation] ul.nav-level-1 a',
      type: 'href',
      subCategories: [
        {
          visible: false,
          sel: 'div.swiper-wrapper a.swiper-slide',
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'fressnapf.de',
    entryPoints: [
      {
        url: 'https://www.fressnapf.de',
        category: 'default',
      },
    ],
    hasEan: true,
    javascript: {
      sharedWorker: 'enabled',
      webWorker: 'enabled',
      serviceWorker: 'disabled',
      webSocket: 'enabled',
    },
    manualCategories: [],
    mimic: 'div[id=__header-inner]',
    paginationEl: [
      {
        type: 'pagination',
        sel: 'div.p-items',
        nav: '?currentPage=',
        calculation: {
          method: 'product_count',
          productsPerPage: 48,
          last: 'div.p-items a',
          sel: 'div.p-items a',
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
        type: 'parse_json_element',
        content: 'instock',
        path: [
          'offers.availability',
          '[1].offers.availability',
          '[0].offers.availability',
        ],
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'price',
        path: ['offers.price', '[1].offers.price', '[0].offers.price'],
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        regexp: '"gtin":\\s*"(\\d+)"',
        path: ['gtin', '[1].gtin', '[0].gtin'],
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'sku',
        path: 'sku',
      },
      {
        parent: 'div.zoom-image.g-image',
        sel: 'img',
        type: 'src',
        content: 'image',
      },
    ],
    productList: [
      {
        sel: 'div.grid-container.product-grid',
        productCntSel: ['div.pl-actions div.divider > div'],
        product: {
          sel: 'div.grid-container.product-grid div.grid-item--product',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'div.pt-content a',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'div.pt-figure img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'div.pt-head',
              type: 'text',
            },
            {
              content: 'mnfctr',
              sel: 'div.pt-subhead',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'span.p-regular-price-value',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'mix',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: ['media', 'font', 'stylesheet', 'image'],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'galaxus.de': {
    actions: [],
    allowedHosts: ['static02.galaxus.com'],
    active: true,
    watchedRoutes: ['/graphql/get-product-list-counts'],
    categories: {
      exclude: [
        'gesamtsortiment',
        'voucher',
        'community',
        'magazin',
        'gutscheine',
        'gebraucht',
      ],
      sel: 'nav[id=mainNavigation] ul li a',
      visible: false,
      type: 'href',
      subCategories: [
        {
          sel: 'nav[id=mainNavigation] ul li a',
          visible: false,
          type: 'href',
        },
      ],
    },
    exceptions: ['https://ub.galaxus.de/ub/de-27'],
    crawlActions: [
      {
        type: 'button',
        sel: 'div[role=dialog] button:nth-child(2)',
        action: 'waitBefore',
        wait: false,
        name: 'click on consent',
      },
      // {
      //   type: 'scroll',
      //   sel: 'none',
      //   name: 'Scroll to bottom',
      //   action: 'scroll',
      // },
    ],
    d: 'galaxus.de',
    entryPoints: [
      {
        url: 'https://www.galaxus.de/de',
        category: 'default',
      },
    ],
    hasEan: true,
    manualCategories: [],
    mimic: 'div[id=logo]',
    javascript: {
      serviceWorker: 'disabled',
      webWorker: 'enabled',
      sharedWorker: 'disabled',
    },
    paginationEl: [
      {
        type: 'click-and-extract',
        sel: 'div[class*=productListFooter] button',
        nav: '?take=',
        calculation: {
          method: 'product_count',
          productsPerPage: 60,
          last: 'div[class*=productListFooter] button',
          sel: 'div[class*=productListFooter] button',
        },
      },
    ],
    pauseOnProductPage: {
      pause: true,
      min: 1200,
      max: 1500,
    },
    product: [
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'price',
        path: 'offers.price',
        multiple: true,
        parent: 'head',
      },
      {
        sel: 'meta[property="product:price:amount"]',
        parent: 'head',
        type: 'content',
        content: 'price',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'instock',
        path: 'offers.availability',
        multiple: true,
        parent: 'head',
      },
      {
        sel: 'meta[property="og:availability"]',
        parent: 'head',
        type: 'content',
        content: 'instock',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        path: 'gtin',
        multiple: true,
        parent: 'head',
      },
      {
        sel: 'meta[property=gtin]',
        parent: 'head',
        type: 'content',
        content: 'ean',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'image',
        path: 'image[0]',
        multiple: true,
        parent: 'head',
      },
      {
        sel: 'meta[property="og:image"]',
        parent: 'head',
        type: 'content',
        content: 'image',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'mnfctr',
        path: 'brand.name',
        multiple: true,
        parent: 'head',
      },
      {
        sel: 'meta[property="og:brand"]',
        parent: 'head',
        type: 'content',
        content: 'mnfctr',
      },
      // {
      //   sel: "script[type='application/ld+json']",
      //   type: "parse_json_element",
      //   content: "name",
      //   path: "name",
      //   multiple: true,
      //   parent: "head",
      // },
      {
        sel: 'meta[property="og:title"]',
        parent: 'head',
        type: 'content',
        content: 'name',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'sku',
        path: 'sku',
        multiple: true,
        parent: 'head',
      },
    ],
    productList: [
      {
        sel: 'main[id=pageContent]',
        productCntSel: [
          'span[id=product-list] ~ div h2',
          'span[id=product-list] ~ h2',
          'h2[class*=productList_Count__]',
        ],
        awaitProductCntSel: true,
        waitProductCntSel: 1000,
        product: {
          sel: 'main[id=pageContent] article',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a[class*=overlayLink_OverlayLink]',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'img',
              type: 'srcset',
            },
            {
              content: 'name',
              sel: 'p[class*=productTileTitle_ProductTileTitleP__]',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div:nth-child(5)',
              fallback: 'div:nth-child(4)',
              type: 'text',
            },
          ],
        },
      },
      {
        sel: 'div[class*=productListProductTiles_]',
        productCntSel: [
          'span[id=product-list] ~ div h2',
          'span[id=product-list] ~ h2',
          'h2[class*=productList_Count__]',
        ],
        awaitProductCntSel: true,
        waitProductCntSel: 1000,
        product: {
          sel: 'div[class*=productListProductTiles_] article',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a[class*=overlayLink_OverlayLink]',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'img',
              type: 'srcset',
            },
            {
              content: 'name',
              sel: 'p[class*=productTileTitle_ProductTileTitleP__]',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'span[class*=productTilePrice_StyledPrice]',
              fallback: 'div:nth-child(4)',
              type: 'text',
            },
          ],
        },
      }
    ],
    proxyType: 'mix',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: [],
      product: [
        'media',
        'manifest',
        'font',
        'image',
        'xhr',
        'other',
        'ping',
        'fetch',
        'script',
        'stylesheet',
      ],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'galeria.de': {
    actions: [],
    active: true,
    ean: '-[0-9]{11,13}',
    categories: {
      exclude: [
        'kleidung',
        'top 10',
        'mode',
        'waesche',
        'schuhe',
        'socken',
        'aktionen',
        'magazin',
        'ratgeber',
        'gutscheine',
        'geschenksets',
        'marken',
        'herren',
        'damen',
        'kinder',
        'sport',
        'reisen',
      ],
      sel: 'nav[data-testId=mainNavigation] > div > div > a',
      visible: false,
      type: 'href',
      subCategories: [
        {
          sel: 'div[media=headerNav] a',
          visible: false,
          type: 'href',
        },
      ],
    },
    crawlActions: [
      {
        type: 'scroll',
        sel: 'none',
        name: 'Scroll to bottom',
        action: 'scroll',
      },
    ],
    d: 'galeria.de',
    entryPoints: [
      {
        url: 'https://www.galeria.de',
        category: 'default',
      },
    ],
    hasEan: false,
    manualCategories: [],
    mimic: "a[data-testid='headerLogo-default'] svg",
    paginationEl: [
      {
        type: 'pagination',
        nav: '?page=',
        sel: "div[data-testid='pagination']",
        calculation: {
          method: 'find_highest',
          sel: "div[data-testid='pagination'] a",
        },
      },
    ],
    pauseOnProductPage: {
      pause: true,
      min: 500,
      max: 900,
    },
    product: [
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'price',
        path: 'offers.price',
        multiple: true,
        parent: 'head',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'instock',
        path: 'offers.availability',
        multiple: true,
        parent: 'head',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        path: 'sku',
        multiple: true,
        parent: 'head',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'image',
        path: 'image[0]',
        multiple: true,
        parent: 'head',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'mnfctr',
        path: 'brand.name',
        multiple: true,
        parent: 'head',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'name',
        path: 'name',
        multiple: true,
        parent: 'head',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'sku',
        path: 'sku',
        multiple: true,
        parent: 'head',
      },
    ],
    productList: [
      {
        sel: 'div:is([id=productList], [id=productList-rest])',
        productCntSel: ['span[data-testid=listingHeaderNumberOfProducts]'],
        product: {
          sel: 'div:is([id=productList], [id=productList-rest]) a',
          type: 'link',
          details: [
            {
              content: 'image',
              sel: 'div[data-testid=product] div[role=img] img',
              type: 'srcset',
            },
            {
              content: 'price',
              sel: 'div[data-testid=product] span.productPrice',
              type: 'text',
            },
            {
              content: 'mnfctr',
              sel: 'div[data-testid=product] p.productTitle',
              type: 'text',
            },
            {
              content: 'name',
              sel: 'div[data-testid=product] p.productInfoLine:nth-of-type(1)',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'de',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: ['media', 'font', 'stylesheet', 'ping', 'image', 'other'],
      product: [
        'media',
        'manifest',
        'font',
        'image',
        'xhr',
        'other',
        'ping',
        'fetch',
        'script',
        'stylesheet',
      ],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'hornbach.de': {
    actions: [],
    active: true,
    categories: {
      exclude: ['wohntrends', 'sortiment'],
      sel: 'ul.hbhd-main-nav__level1 > li.hbhd-main-nav__item:nth-child(2) a',
      type: 'href',
      subCategories: [
        {
          sel: "div[data-hb-namespace='listing-nav-categories'] a",
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'hornbach.de',
    entryPoints: [
      {
        url: 'https://www.hornbach.de',
        category: 'default',
      },
    ],
    hasEan: true,
    manualCategories: [],
    mimic:
      "header[data-hb-namespace='page-header'] a.hbhd-topline__hornbach-logo",
    paginationEl: [
      {
        type: 'pagination',
        sel: 'div[data-testid=pagination-bar',
        nav: '?page=',
        calculation: {
          method: 'find_highest',
          sel: 'div[data-testid=pagination-bar] span',
        },
      },
    ],
    pauseOnProductPage: {
      pause: true,
      min: 900,
      max: 1200,
    },
    product: [
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        path: 'gtin12',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        path: 'gtin13',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'sku',
        path: 'sku',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'instock',
        path: 'offers[0].availability',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'price',
        path: 'offers[0].price',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'name',
        path: 'name',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'image',
        path: 'image[0].url',
      },
    ],
    javascript: {
      webWorker: 'enabled',
      serviceWorker: 'disabled',
      sharedWorker: 'disabled',
    },
    productList: [
      {
        sel: 'div[data-testid=item-list]',
        productCntSel: ['div[class*=al-ui-resultCount]'],
        product: {
          sel: 'div[data-testid=article-card]',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'img[data-testId=article-image]',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'h4[data-testid="article-title"]',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div > div > div > div > div>  span',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'mix',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: [
        'media',
        'font',
        'ping',
        'image',
        'other',
        'script',
        'fetch',
        'xhr',
        // 'stylesheet',
      ],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'idealo.de': {
    actions: [
      {
        type: 'recursive-button',
        sel: 'button.productOffers-listLoadMore',
        action: 'click',
        waitDuration: 600,
        name: 'load more',
        wait: false,
      },
    ],
    allowedHosts: ['cdn.idealo.com'],
    active: true,
    categories: {
      exclude: ['flug', 'flüge', 'hotel'],
      sel: 'div.TopCategoriesCarouselstyle__TopCategoriesTextCarousel-sc-5vawzj-1 a',
      type: 'href',
      subCategories: [
        {
          sel: 'div[data-testid="categoryOverview"] div[data-testid="category-grid-item"] a:not([class*="_popularLink"])',
          type: 'href',
        },
      ],
    },
    crawlActions: [
      {
        type: 'button',
        sel: 'a.productVariants-listItemWrapper',
        action: 'click',
        name: 'click on variant',
        wait: true,
      },
    ],
    d: 'idealo.de',
    entryPoints: [
      {
        url: 'https://www.idealo.de',
        category: 'default',
      },
    ],
    exceptions: ['https://www.idealo.de/offerpage/offerlist/product/'],
    hasEan: true,
    manualCategories: [
      {
        name: 'Sale',
        link: 'https://www.idealo.de/preisvergleich/MainSearchProductCategory/100oE0oJ4.html',
      },
    ],
    mimic: 'svg.i-header-logo-image',
    paginationEl: [
      {
        type: 'pagination',
        sel: 'div[class*=sr-pagination__numbers]',
        nav: 'I16-<page>.html',
        paginationUrlSchema: {
          replaceRegexp: '\\.html',
          withQuery: false,
          calculation: {
            method: 'offset',
            offset: 15,
          },
        },
        calculation: {
          method: 'count',
          last: 'div[class*=sr-pagination__numbers] a[class*=sr-pageElement]',
          sel: 'div[class*=sr-pagination__numbers] a[class*=sr-pageElement]',
        },
      },
      {
        type: 'pagination',
        sel: 'ul.pagination',
        nav: '/100I16-<page>.html?q=<query>',
        paginationUrlSchema: {
          replaceRegexp: '\\.html\\?q=\\S*',
          withQuery: true,
          calculation: {
            method: 'offset',
            offset: 15,
          },
        },
        calculation: {
          method: 'count',
          last: 'li.pagination-item a',
          sel: 'li.pagination-item a',
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
        type: 'parse_json_element',
        content: 'image',
        path: 'image[0]',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'price',
        path: 'offers.lowPrice',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'instock',
        path: 'offers.availability',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        path: 'gtin',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'sku',
        path: 'sku',
      },
    ],
    productList: [
      {
        sel: 'div.offerList',
        timeout: 100,
        productCntSel: [
          'span[class*=offerList-count]',
          'span[class*=sr-resultTitle__resultCount]',
        ],
        product: {
          sel: 'div.offerList a.offerList-itemWrapper',
          type: 'link',
          details: [
            {
              content: 'image',
              sel: 'img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'div.offerList-item-description-title',
              type: 'text',
            },
            {
              content: 'description',
              sel: 'span.description-part-one',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.offerList-item-priceMin',
              type: 'text',
            },
          ],
        },
      },
      {
        sel: 'div[id=offerList]',
        timeout: 100,
        productCntSel: [
          'span[class*=offerList-count]',
          'span[class*=sr-resultTitle__resultCount]',
        ],
        product: {
          sel: 'div[id=offerList] li.productOffers-listItem',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a.productOffers-listItemTitle',
              type: 'href',
            },
            {
              content: 'vendor',
              sel: 'div[id=offerList] li.productOffers-listItem',
              attr: 'data-dl-click',
              key: 'shop_name',
              type: 'parse_object_property',
            },
            {
              content: 'name',
              sel: 'span.productOffers-listItemTitleInner',
              type: 'text',
            },
            {
              content: 'price',
              attr: 'data-dl-click',
              key: 'products[0].price',
              sel: 'div[id=offerList] li.productOffers-listItem',
              type: 'parse_object_property',
            },
          ],
        },
      },
      {
        sel: 'div[class*=sr-resultList__]',
        timeout: 100,
        productCntSel: [
          'span[class*=offerList-count]',
          'span[class*=sr-resultTitle__resultCount]',
        ],
        product: {
          sel: 'div[class*=sr-resultList_] div[class*=sr-resultList__item]',
          type: 'not_link',
          details: [
            {
              content: 'vendor',
              sel: 'div[class*=sr-singleOffer__shopName] span[role=link]',
              type: 'text',
            },
            {
              content: 'link',
              sel: 'div[class*=sr-resultItemLink] a',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'div[class*=sr-resultItemTile__imageSection] noscript',
              type: 'text',
              extractPart: 0,
              regexp: '(www|http:|https:)+[^\\s]+[\\w]',
            },
            {
              content: 'name',
              sel: 'div[class*=sr-productSummary__title]',
              type: 'text',
            },
            {
              content: 'description',
              sel: 'div[class*=sr-productSummary__description]',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div[class*=sr-detailedPriceInfo__price]',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'de',
    queryActions: [],
    queryUrlSchema: [
      {
        baseUrl:
          'https://www.idealo.de/preisvergleich/MainSearchProductCategory.html?q=<query>',
        category: 'default',
      },
    ],
    resourceTypes: {
      crawl: ['media', 'font', 'stylesheet', 'ping', 'image', 'xhr', 'other'],
      product: [
        'media',
        'manifest',
        'font',
        'image',
        'xhr',
        'other',
        'ping',
        'fetch',
        'script',
        'stylesheet',
      ],
    },
    rules: [
      {
        description:
          "Block all .js files except those containing 'vendor' or 'idealo-'",
        action: 'abort',
        conditions: [
          {
            type: 'endsWith',
            value: '.js',
          },
          {
            type: 'notIncludes',
            value: 'vendor',
          },
          {
            type: 'notIncludes',
            value: 'idealo-',
          },
        ],
      },
      {
        description: 'Block URLs matching a specific UUID pattern',
        action: 'abort',
        conditions: [
          {
            type: 'regexMatch',
            value:
              '[0-9a-fA-F]{8}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{12}',
          },
        ],
      },
    ],
    waitUntil: {
      product: 'domcontentloaded',
      entryPoint: 'domcontentloaded',
    },
  },
  'lidl.de': {
    actions: [],
    active: false,
    categories: {
      exclude: [
        'lidl-connect',
        'newsletter-anmeldeseite',
        'lidl-fotos',
        'themenwelt',
        'rezepte',
        'lidl-plus',
        'mode',
        'guthabenkarten',
        'gutscheine',
      ],
      sel: 'li[data-mdd-level2-id] a',
      type: 'href',
      subCategories: [
        {
          sel: 'ul.s-facet__list li.s-facet__item--parent div.s-link--REFINE a',
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'mindfactory.de',
    entryPoints: [
      {
        url: 'https://www.mindfactory.de',
        category: 'default',
      },
    ],
    manualCategories: [],
    mimic: 'div[id=boxtop] div.logo-parent',
    paginationEl: [
      {
        type: 'pagination',
        sel: 'ul.pagination',
        nav: '/page/',
        calculation: {
          method: 'find_highest',
          last: 'ul.pagination a',
          sel: 'ul.pagination a',
        },
      },
    ],
    productList: [
      {
        sel: 'div[id=bProducts]',
        productCntSel: [
          'div.show-articles-per-page-top span.bold:nth-child(3)',
        ],
        product: {
          sel: 'div.p',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'div.pcontent a',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'div.pcontent img',
              type: 'data-src',
            },
            {
              content: 'name',
              sel: 'div.pcontent div.pname',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.pcontent div.pprice',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'mix',
    hasEan: true,
    product: [
      {
        sel: 'div.pshipping a',
        parent: 'form[name=cart_quantity]',
        type: 'text',
        content: 'instock',
      },
      {
        sel: 'div.pprice',
        parent: 'form[name=cart_quantity]',
        type: 'text',
        content: 'price',
      },
      {
        sel: 'span[itemprop=gtin8]',
        parent: 'form[name=cart_quantity]',
        type: 'content',
        content: 'ean',
      },
      {
        sel: 'div[id=bImageCarousel] img',
        parent: 'form[name=cart_quantity]',
        type: 'src',
        content: 'image',
      },
    ],
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: [
        'media',
        'font',
        'stylesheet',
        'ping',
        'image',
        'xhr',
        'fetch',

        'script',
        'other',
      ],
    },
    waitUntil: {
      product: 'domcontentloaded',
      entryPoint: 'domcontentloaded',
    },
  },
  'mueller.de': {
    actions: [],
    active: true,
    allowedHosts: ['static.mueller.de'],
    categories: {
      exclude: [
        'marken',
        'foto',
        'mobilfunk',
        'information',
        'exklusiv',
        'alle',
      ],
      wait: 14000,
      visible: false,
      sel: 'li:not(.mu-navigation__item--all) a:is(.mu-navigation__link,.mu-navigation__special-link)',
      type: 'href',
      subCategories: [
        {
          sel: 'a.mu-category-overview-desktop__link.mu-category-overview-desktop__link--main',
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'mueller.de',
    entryPoints: [
      {
        url: 'https://www.mueller.de',
        category: 'default',
      },
    ],
    exceptions: [
      'https://static.mueller.de/6f23f1202b2a99aa40c25dfc48658c418d2c5bbd/assets/base/images/fallback_image.png',
    ],
    hasEan: true,
    manualCategories: [],
    mimic: 'img.mu-header__logo',
    paginationEl: [
      {
        type: 'pagination',
        sel: 'div.mu-pagination__pages',
        nav: '?p=',
        calculation: {
          method: 'count',
          last: 'div.mu-pagination__pages span.mu-button2__content',
          sel: 'div.mu-pagination__pages span.mu-button2__content',
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
        type: 'parse_json_element',
        content: 'price',
        path: 'offers[0].price',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'instock',
        path: 'offers[0].availability',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        path: 'gtin13',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'sku',
        path: 'sku',
      },
      {
        sel: 'img.mu-image-magnify__preview-image',
        parent: 'div.mu-product-gallery__preview',
        type: 'src',
        content: 'image',
      },
      {
        sel: 'div.mu-delivery-selector-option__text',
        parent: 'div.mu-delivery-selector-option__info-container',
        content: 'instock',
        type: 'text',
      },
    ],
    productList: [
      {
        sel: 'div.mu-product-list__items',
        productCntSel: ['span.mu-product-list-page__headline-count'],
        product: {
          sel: 'a.mu-product-tile.mu-product-list__item',
          type: 'link',
          details: [
            {
              content: 'image',
              sel: 'img.mu-product-tile__image',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'div.mu-product-tile__name',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'span.mu-product-tile__price',
              type: 'text',
            },
            {
              content: 'promoPrice',
              sel: 'span.mu-product-tile__price--promo',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'mix',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: ['media', 'font', 'ping', 'image', 'xhr', 'fetch', 'other'],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'mindfactory.de': {
    actions: [],
    active: true,
    categories: {
      exclude: ['mindstart', 'actionen', 'highlights', 'software'],
      sel: 'div[id=cMaincat] ul:nth-of-type(2) a',
      type: 'href',
      subCategories: [
        {
          sel: 'ul.cat_level_0 a.sprites_general',
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'mindfactory.de',
    entryPoints: [
      {
        url: 'https://www.mindfactory.de',
        category: 'default',
      },
    ],
    manualCategories: [],
    mimic: 'div[id=boxtop] div.logo-parent',
    paginationEl: [
      {
        type: 'pagination',
        sel: 'ul.pagination',
        nav: '/page/',
        calculation: {
          method: 'find_highest',
          last: 'ul.pagination a',
          sel: 'ul.pagination a',
        },
      },
    ],
    productList: [
      {
        sel: 'div[id=bProducts]',
        productCntSel: [
          'div.show-articles-per-page-top span.bold:nth-child(3)',
        ],
        product: {
          sel: 'div.p',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'div.pcontent a',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'div.pcontent img',
              type: 'data-src',
            },
            {
              content: 'name',
              sel: 'div.pcontent div.pname',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.pcontent div.pprice',
              type: 'text',
            },
          ],
        },
      },
      {
        sel: 'div.minddeal-area',
        productCntSel: [
          'div.show-articles-per-page-top span.bold:nth-child(3)',
        ],
        product: {
          sel: 'div.damn-product',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'div.img a',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'div.img img',
              type: 'data-src',
            },
            {
              content: 'name',
              sel: 'span[data-minddeal-name]',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'span[data-minddeal-price]',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'de',
    hasEan: true,
    product: [
      {
        sel: 'div.pshipping a',
        parent: 'form[name=cart_quantity]',
        type: 'text',
        content: 'instock',
      },
      {
        sel: 'div.pprice',
        parent: 'form[name=cart_quantity]',
        type: 'text',
        content: 'price',
      },
      {
        sel: 'span[itemprop=gtin8]',
        parent: 'form[name=cart_quantity]',
        type: 'content',
        content: 'ean',
      },
      {
        sel: 'div[id=bImageCarousel] img',
        parent: 'form[name=cart_quantity]',
        type: 'src',
        content: 'image',
      },
    ],
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: [
        'media',
        'font',
        'stylesheet',
        'ping',
        'image',
        'xhr',
        'fetch',
        'script',
        'other',
      ],
    },
    waitUntil: {
      product: 'domcontentloaded',
      entryPoint: 'domcontentloaded',
    },
  },
  'notebooksbilliger.de': {
    actions: [],
    active: true,
    categories: {
      exclude: [
        'lenovo+tech+sale',
        'aboexpress',
        'systemhaus',
        'store+angebote',
        'studentenprogramm',
        'finanzierung',
      ],
      sel: 'aside.sidebar a.sidebar__navigation-entry',
      type: 'href',
      subCategories: [
        {
          sel: 'aside.sidebar a.sidebar__navigation-entry',
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'notebooksbilliger.de',
    entryPoints: [
      {
        url: 'https://www.notebooksbilliger.de',
        category: 'default',
      },
    ],
    hasEan: true,
    manualCategories: [],
    mimic: 'a.header-inner__logo',
    paginationEl: [
      {
        type: 'pagination',
        sel: 'a.product-listing__more-link',
        nav: '?page=',
        calculation: {
          method: 'match_text',
          textToMatch: 'Mehr Produkte anzeigen',
          dynamic: true,
          last: 'a.product-listing__more-link',
          sel: 'a.product-listing__more-link',
        },
      },
    ],
    pauseOnProductPage: {
      pause: true,
      min: 700,
      max: 900,
    },
    product: [
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        path: 'gtin12',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        path: 'gtin13',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'sku',
        path: 'sku',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'instock',
        path: 'offers.availability',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'price',
        path: 'offers.price',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'name',
        path: 'name',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'image',
        path: 'image',
      },
    ],
    productList: [
      {
        sel: 'ul[id=product-listing]',
        productCntSel: ['span.product-listing__products-count'],
        product: {
          sel: 'li.product-listing__row',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'img',
              type: 'srcset',
            },
            {
              content: 'name',
              sel: 'div.product-card__product-heading-title',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.product-price__price-wrapper',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'de',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: ['media', 'font', 'ping', 'image', 'other'],
      product: [
        'media',
        'manifest',
        'font',
        'image',
        'other',
        'ping',
        'script',
        'stylesheet',
      ],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'notino.de': {
    actions: [],
    active: true,
    categories: {
      exclude: [
        'inspiration',
        'premium',
        'marken',
        'loggen sie sich ein',
        'angebote',
      ],
      sel: 'div[data-testid=menu-wrapper] a',
      type: 'href',
      visible: false,
      subCategories: [
        {
          visible: false,
          sel: 'div[id=sidebarWrapper] a[class*=styled__StyledLink]',
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'notino.de',
    entryPoints: [
      {
        url: 'https://www.notino.de',
        category: 'default',
      },
    ],
    hasEan: true,
    manualCategories: [],
    mimic: 'svg[data-testid=notino-logo-icon]',
    paginationEl: [
      {
        type: 'pagination',
        sel: 'div[class*=styled__StyledPager]',
        nav: '?f=<page><apendix>',
        paginationUrlSchema: {
          calculation: {
            method: 'find_pagination_apendix',
            type: 'href',
            sel: "link[rel='next']",
            replace: [
              {
                replace: '<apendix>',
                search: '-\\d+(?:-\\d+)*$',
              },
            ],
          },
        },
        calculation: {
          method: 'find_highest',
          last: 'div[class*=styled__StyledPager] span[data-testid=page-item]',
          sel: 'div[class*=styled__StyledPager] span[data-testid=page-item]',
        },
      },
    ],
    pauseOnProductPage: {
      pause: true,
      min: 900,
      max: 1000,
    },
    product: [
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        path: 'gtin12',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        path: 'gtin13',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'sku',
        path: 'sku',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'instock',
        path: 'offers.availability',
      },
      {
        sel: 'span[data-testid=pd-price]',
        parent: 'div[data-testid=pd-price-wrapper]',
        type: 'text',
        content: 'price',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'name',
        path: 'name',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'image',
        path: 'image',
      },
    ],
    productList: [
      {
        sel: 'div[id=productListWrapper]',
        productCntSel: [],
        product: {
          sel: 'div[data-testid=product-container]',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'img',
              type: 'srcset',
            },
            {
              content: 'mnfctr',
              sel: 'h2',
              type: 'text',
            },
            {
              content: 'name',
              sel: 'h3',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'span[data-testid=price-component]',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'de',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: [
        'media',
        'font',
        'stylesheet',
        'ping',
        'image',
        'xhr',
        'fetch',

        'script',
        'other',
      ],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'reichelt.de': {
    actions: [],
    active: true,
    categories: {
      categoryNameSegmentPos: 0,
      categoryRegexp: '\\/([^\\/]+?)-c\\d+',
      exclude: [
        'gruppen',
        'artikel',
        'filename',
        'informationen',
        'sicherheitsnormen',
      ],
      sel: 'a:is(.rootgroups,.rtgrps,.nwmshp,.sale)',
      type: 'href',
      visible: false,
      subCategories: [
        {
          visible: false,
          sel: 'ul[id=pictogramm] li.pre[class*=pictogramm_] a',
          type: 'href',
        },
        {
          visible: false,
          sel: 'div.category-page a.category__headline',
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'reichelt.de',
    ece: ['/&SID=(\\d|\\w)+/g'],
    entryPoints: [
      {
        url: 'https://www.reichelt.de',
        category: 'default',
      },
    ],
    hasEan: true,
    manualCategories: [],
    mimic: 'label[for=loginb]',
    javascript: {
      sharedWorker: 'disabled',
      webWorker: 'disabled',
      serviceWorker: 'enabled',
    },
    paginationEl: [
      {
        type: 'infinite_scroll',
        sel: '#pagination',
        nav: '&PAGE=',
        calculation: {
          method: 'count',
          last: '#pagination',
          sel: '#pagination',
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
        sel: 'meta[itemprop=price]',
        parent: 'html',
        content: 'price',
        type: 'content',
      },
      {
        sel: 'li[itemprop=gtin13]',
        parent: 'html',
        type: 'text',
        content: 'ean',
      },
      {
        sel: 'link[itemprop=availability]',
        parent: 'html',
        content: 'instock',
        type: 'href',
      },
      {
        sel: "meta[name='og:image']",
        parent: 'Html',
        content: 'image',
        type: 'content',
      },
    ],
    productList: [
      {
        sel: 'div[id=al_artikellist]',
        productCntSel: ['li.category-active'],
        product: {
          sel: 'div[id=al_artikellist] div.al_gallery_article',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a.al_artinfo_link',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'div.al_artlogo picture img',
              type: 'data-src',
            },
            {
              content: 'van',
              sel: 'meta[itemprop=productID]',
              type: 'content',
            },
            {
              content: 'name',
              sel: 'a.al_artinfo_link',
              type: 'title',
            },
            {
              content: 'description',
              sel: 'ul[itemprop=description]',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'meta[itemprop=price]',
              type: 'content',
            },
          ],
        },
      },
      {
        sel: 'div.articlestage_02',
        productCntSel: ['li.category-active'],
        product: {
          sel: 'article a',
          type: 'link',
          details: [
            {
              content: 'image',
              sel: 'div.al_artlogo img[data-original]',
              type: 'data-original',
            },
            {
              content: 'van',
              sel: 'meta[itemprop=productID]',
              type: 'content',
            },
            {
              content: 'name',
              sel: 'div.hghlght',
              type: 'text',
            },
            {
              content: 'description',
              sel: 'p.short_text',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'span.pricetag',
              type: 'text',
            },
          ],
        },
      },
      {
        sel: 'section.swiper-wrapper',
        productCntSel: ['li.category-active'],
        product: {
          sel: 'article a',
          type: 'link',
          details: [
            {
              content: 'image',
              sel: 'img',
              type: 'src',
            },
            {
              content: 'van',
              sel: 'meta[itemprop=productID]',
              type: 'content',
            },
            {
              content: 'name',
              sel: 'div.hghlght',
              type: 'text',
            },
            {
              content: 'description',
              sel: 'p.short_text',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'span.oldprice',
              type: 'text',
            },
            {
              content: 'promoPrice',
              sel: 'span.prc',
              type: 'text',
            },
          ],
        },
      },
      {
        sel: '#wrapper div.swiper-slide a',
        productCntSel: ['li.category-active'],
        product: {
          sel: '#wrapper div.swiper-slide a',
          type: 'link',
          details: [
            {
              content: 'image',
              sel: 'img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'span.headline',
              type: 'text',
            },
            {
              content: 'description',
              sel: 'span.shorttext',
              type: 'text',
            },
            {
              content: 'price',
              remove: 'span.oldprice',
              sel: 'span.price',
              type: 'nested_remove',
            },
          ],
        },
      },
    ],
    proxyType: 'de',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: [
        'media',
        'font',
        'stylesheet',
        'ping',
        'image',
        'xhr',
        'fetch',
        'other',
      ],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'saturn.de': {
    actions: [],
    active: true,
    categories: {
      exclude: [
        'mindstart',
        'specials',
        'actionen',
        'fotoparadies.de',
        'brand',
        'service',
        'store',
        'myaccount',
        'content',
        '/product/',
        'b2b-business-solutions',
      ],
      sel: '',
      type: 'href',
      subCategories: [
        {
          visible: false,
          sel: 'a[data-test=mms-search-category-content-sidenav-link]',
          type: 'href',
        },
        {
          visible: false,
          sel: 'section[id=alle_kategorien] a[data-test=mms-router-link][target=_self]',
          type: 'href',
        },
        {
          visible: false,
          sel: 'section[id*=kategorien i] a[data-test=mms-router-link][target=_self]',
          type: 'href',
        },
      ],
    },
    crawlActions: [
      {
        type: 'element',
        name: 'Cookie Consent',
        sel: 'div[id=mms-consent-portal-container]',
        action: 'delete',
        interval: 100,
      },
      {
        type: 'scroll',
        sel: 'none',
        name: 'Scroll to bottom',
        action: 'scroll',
      },
    ],
    d: 'saturn.de',
    entryPoints: [
      {
        url: 'https://www.saturn.de',
        category: 'default',
      },
    ],
    hasEan: true,
    manualCategories: [
      {
        name: 'Angebote & Aktionen',
        link: 'https://www.saturn.de/de/campaign/angebote-aktionen',
      },
      {
        name: 'OUTLET%',
        link: 'https://www.saturn.de/de/campaign/restposten',
      },
      {
        name: 'Computer + Tablet',
        link: 'https://www.saturn.de/de/category/computer-tablet-1.html',
      },
      {
        name: 'Smartphone + Tarife',
        link: 'https://www.saturn.de/de/category/smartphones-tarife-467.html',
      },
      {
        name: 'TV + Beamer',
        link: 'https://www.saturn.de/de/category/tv-beamer-1069.html',
      },
      {
        name: 'Küche',
        link: 'https://www.saturn.de/de/category/haushalt-küche-bad-1197.html',
      },
      {
        name: 'Haushalt + Garten',
        link: 'https://www.saturn.de/de/category/haushalt-garten-707.html',
      },
      {
        name: 'Gaming + VR',
        link: 'https://www.saturn.de/de/specials/gaming-welt',
      },
      {
        name: 'Audio',
        link: 'https://www.saturn.de/de/category/audio-2511.html',
      },
      {
        name: 'Kameras + Foto',
        link: 'https://www.saturn.de/de/category/kameras-foto-356.html',
      },
      {
        name: 'Fitness + Gesundheit',
        link: 'https://www.saturn.de/de/category/fitness-gesundheit-700.html',
      },
      {
        name: 'Beauty + Wellness',
        link: 'https://www.saturn.de/de/category/beauty-wellness-706.html',
      },
      {
        name: 'Spielzeug + Freizeit',
        link: 'https://www.saturn.de/de/category/spielzeug-freizeit-2492.html',
      },
      {
        name: 'Büro + Homeoffice',
        link: 'https://www.saturn.de/de/category/büro-kommunikation-2820.html',
      },
      {
        name: 'Filme + Musik',
        link: 'https://www.saturn.de/de/category/film-serien-musik-994.html',
      },
      {
        name: 'Smart Home',
        link: 'https://www.saturn.de/de/category/smart-home-5000.html',
      },
      {
        name: 'Erneuerbare Energien',
        link: 'https://www.saturn.de/de/category/erneuerbare-energien-9000.html',
      },
      {
        name: 'Refurbished',
        link: 'https://www.saturn.de/de/campaign/refurbished',
      },
    ],
    mimic: 'img[data-test=styled-logo]',
    paginationEl: [
      {
        type: 'recursive-more-button',
        sel: "button:is([aria-label='Mehr Produkte anzeigen'], [aria-label='Mehr Angebote'])",
        nav: '?page=',
        calculation: {
          method: 'find_highest',
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
        type: 'parse_json_element',
        content: 'price',
        parent: 'head',
        path: 'object.offers[0].price',
        multiple: true,
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'instock',
        parent: 'head',
        path: 'object.offers[0].availability',
        multiple: true,
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        parent: 'head',
        path: 'object.gtin13',
        multiple: true,
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'sku',
        parent: 'head',
        path: 'object.sku',
        multiple: true,
      },
      {
        sel: 'img',
        parent: 'div.pdp-gallery-image',
        type: 'src',
        content: 'image',
      },
    ],
    productList: [
      {
        sel: 'div[data-test=mms-search-srp-productlist]',
        productCntSel: ['section[data-test=mms-search-srp-headlayout] div'],
        product: {
          sel: 'div[data-test=mms-search-srp-productlist] div[data-test=mms-product-card]',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a[data-test=mms-router-link-product-list-item-link]',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'picture[data-test=product-image] img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'div[title] p',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div[data-test*=product-price] span[spacing=base]',
              type: 'text',
            },
          ],
        },
      },
      {
        sel: 'section[id*=product-grid]',
        productCntSel: ['section[data-test=mms-search-srp-headlayout] div'],
        product: {
          sel: 'section[id*=product-grid] div[data-test=mms-campaigns-productGrid-product]',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'picture img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'p[data-test=product-title]',
              type: 'text',
            },
            {
              content: 'mnfctr',
              sel: 'p[data-test=product-manufacturer]',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div[data-test*=product-price] span[spacing=base]',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'des',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: ['media', 'font', 'ping', 'image', 'xhr', 'other'],
      product: [
        'media',
        'manifest',
        'font',
        'image',
        'xhr',
        'other',
        'ping',
        'fetch',
        'script',
        'stylesheet',
      ],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'voelkner.de': {
    actions: [],
    active: true,
    categories: {
      exclude: ['#', 'voelkner-finds'],
      sel: 'li.js_load_subcategories a',
      type: 'href',
      subCategories: [
        {
          sel: 'div.grid_container div.category__box a',
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'voelkner.de',
    entryPoints: [
      {
        url: 'https://www.voelkner.de',
        category: 'default',
      },
    ],
    hasEan: true,
    manualCategories: [
      {
        name: 'Computer & Büro',
        link: 'https://www.voelkner.de/categories/13140/computer-buero.html',
      },
      {
        name: 'Multimedia',
        link: 'https://www.voelkner.de/categories/13141/multimedia.html',
      },
      {
        name: 'Haus & Garten',
        link: 'https://www.voelkner.de/categories/13146/haus-garten.html',
      },
      {
        name: 'Beleuchtung',
        link: 'https://www.voelkner.de/categories/13147/beleuchtung.html',
      },
      {
        name: 'Stromversorgung',
        link: 'https://www.voelkner.de/categories/13145/stromversorgung.html',
      },
      {
        name: 'Auto & Navigation',
        link: 'https://www.voelkner.de/categories/13144/auto-amp-navigation.html',
      },
      {
        name: 'Werkstatt',
        link: 'https://www.voelkner.de/categories/13148/werkstatt.html',
      },
      {
        name: 'Bauelemente',
        link: 'https://www.voelkner.de/categories/13149/bauelemente.html',
      },
      {
        name: 'Freizeit & Hobby',
        link: 'https://www.voelkner.de/categories/13150/freizeit-hobby.html',
      },
    ],
    mimic: 'a.head__wrapper__group__button svg',
    paginationEl: [
      {
        type: 'pagination',
        sel: 'div[id=js_search_pagination_bottom]',
        nav: '?page=',
        calculation: {
          method: 'match_text',
          textToMatch: 'Weitere Produkte anzeigen',
          dynamic: true,
          last: 'button.button--solid.js_load_results',
          sel: 'button.button--solid.js_load_results',
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
        sel: 'link[itemprop=availability]',
        parent: 'div.product__price--large',
        type: 'href',
        content: 'instock',
      },
      {
        sel: 'span[itemprop=price]',
        parent: 'div.product__price--large',
        type: 'content',
        content: 'price',
      },
      {
        sel: 'meta[itemprop=gtin]',
        parent: 'div.grid_container.product',
        type: 'content',
        content: 'ean',
      },
      {
        sel: 'meta[itemprop=sku]',
        parent: 'div.grid_container.product',
        type: 'content',
        content: 'sku',
      },
    ],
    productList: [
      {
        sel: 'div[id=js_search_listing_results]',
        productCntSel: ['span.reptile_tilelist__itemCount'],
        product: {
          sel: 'div.search_results__result',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a.product__title',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'a.product__image img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'a.product__title',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div[class*=product__price__wrapper]',
              type: 'text',
            },
          ],
        },
      },
      {
        sel: 'div.dailydeal',
        productCntSel: ['span.reptile_tilelist__itemCount'],
        product: {
          sel: 'div.deal',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a.deal__link',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'div.deal__image img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'span.product__title--small',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'span[itemprop=price]',
              type: 'content',
            },
          ],
        },
      },
    ],
    proxyType: 'mix',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: [
        'media',
        'font',
        'stylesheet',
        'ping',
        'image',
        'xhr',
        'fetch',
        'script',
        'other',
      ],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'proshop.de': {
    actions: [],
    active: true,
    categories: {
      exclude: ['outlet', 'bücher', 'buecher', 'software'],
      sel: 'ul.ps-nav__main li.ps-nav__cat a',
      type: 'href',
      regexpMatchIndex: 0,
      categoryRegexp: '(\\w+-\\w+|\\w+-\\w+-\\w+|\\w+-\\w+-\\d+|\\w+-\\d+)',
      subCategories: [
        {
          sel: 'div.selectedCategorySubCategories a',
          type: 'href',
        },
        {
          sel: 'div.Categorie-Grid a',
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'proshop.de',
    entryPoints: [
      {
        url: 'https://www.proshop.de',
        category: 'default',
      },
    ],
    hasEan: true,
    manualCategories: [],
    mimic: 'header[id=pageHeader] div.header__logo',
    paginationEl: [
      {
        type: 'pagination',
        sel: 'ul.pagination',
        nav: '?pn=',
        calculation: {
          method: 'count',
          last: 'ul.pagination li',
          sel: 'ul.pagination li',
        },
      },
    ],
    pauseOnProductPage: {
      pause: true,
      min: 700,
      max: 900,
    },
    product: [
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        path: 'gtin12',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        path: 'gtin13',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'sku',
        path: 'sku',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'mpn',
        path: 'mpn',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'instock',
        path: 'offers.availability',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'price',
        path: 'offers.price',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'name',
        path: 'name',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'image',
        path: 'image',
      },
    ],
    productList: [
      {
        sel: 'ul.site-panel',
        productCntSel: ['div.site-active-results-container'],
        product: {
          sel: 'li[product]',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'h2[product-display-name]',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'span.site-currency-lg',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'de',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: [
        'media',
        'font',
        'stylesheet',
        'ping',
        'image',
        'xhr',
        'fetch',
        'script',
        'other',
      ],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'rossmann.de': {
    actions: [],
    active: true,
    categories: {
      exclude: ['marken', 'ideenwelt', 'angebote'],
      sel: 'div.rm-navigation__group--main li.rm-navigation__item div.rm-navigation__item-wrap > span> a.rm-cms__link',
      type: 'href',
      subCategories: [
        {
          visible: false,
          sel: 'div.rm-category-nav__list div.rm-category-nav__item a',
          type: 'href',
        },
        {
          visible: false,
          sel: 'div.rm-canvas a[data-promotion-link]:not([target=_blank])',
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'rossmann.de',
    entryPoints: [
      {
        url: 'https://www.rossmann.de',
        category: 'default',
      },
    ],
    hasEan: false,
    ean: 'p/[0-9]{11,13}',
    manualCategories: [],
    mimic: 'div[class*=rm-icon__signet--desktop] img.rm-icon-signet',
    paginationEl: [
      {
        type: 'pagination',
        sel: 'div.rm-pagination a',
        nav: '?page=<page>&pageSize=24#',
        paginationUrlSchema: {
          replace: 'attach_end',
          calculation: {
            method: 'offset',
            offset: 1,
          },
        },
        calculation: {
          method: 'find_highest',
          last: 'div.rm-pagination a',
          sel: 'div.rm-pagination a',
        },
      },
    ],
    pauseOnProductPage: {
      pause: true,
      min: 700,
      max: 900,
    },
    product: [
      {
        sel: 'meta[itemprop=price]',
        parent: 'section.rm-productdetail',
        type: 'content',
        content: 'price',
      },
      {
        sel: 'span[itemprop=sku]',
        parent: 'section.rm-productdetail',
        type: 'content',
        content: 'ean',
      },
      {
        sel: 'span[itemprop=brand] meta[itemprop=name]',
        parent: 'section.rm-productdetail',
        type: 'content',
        content: 'mnfctr',
      },
      {
        sel: 'div.rm-product__card div.rm-product__title',
        parent: 'section.rm-productdetail',
        type: 'text',
        content: 'name',
      },
      {
        sel: "meta[itemprop='availability']",
        parent: 'div.rm-product-structured-data',
        type: 'content',
        content: 'instock',
      },
    ],
    productList: [
      {
        sel: 'div.rm-category__products',
        productCntSel: [],
        product: {
          sel: 'div.rm-category__products div.rm-grid__content',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a.rm-tile-product__image',
              type: 'href',
            },
            {
              content: 'mnfctr',
              sel: 'div.rm-product__brand',
              type: 'text',
            },
            {
              content: 'image',
              sel: 'picture.rm-tile-product__image img',
              type: 'data-src',
            },
            {
              content: 'name',
              sel: 'div.rm-product__title',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.rm-price div.rm-price__current',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'mix',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: [
        'media',
        'font',
        'ping',
        'image',
        'other',
        'script',
        'fetch',
        'xhr',
        'stylesheet',
      ],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'sellercentral.amazon.de': {
    active: true,
    d: 'sellercentral.amazon.de',
    entryPoints: [
      {
        url: 'https://sellercentral.amazon.de/hz/fba/profitabilitycalculator/index?lang=de_DE',
        category: 'default',
      },
    ],
    allowedHosts: ['d29zc3pk4tzg0k.cloudfront.net'],
    mimic: 'div[id=a-page]',
    categories: {
      sel: '',
      type: '',
      exclude: [],
      subCategories: [],
    },
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
        sel: 'img',
        parent: 'div[id=product-detail-left]',
        type: 'src',
        content: 'a_img',
        step: 0,
      },
      {
        sel: 'thead tr td kat-link',
        parent: 'table.product-detail-table-left',
        type: 'label',
        content: 'name',
        step: 0,
      },
      {
        sel: 'tbody tr td:nth-child(2)',
        parent: 'table.product-detail-table-left',
        type: 'text',
        content: 'asin',
        step: 0,
      },
      {
        sel: 'tbody tr:nth-child(3) td:nth-child(2)',
        parent: 'table.product-detail-table-right',
        type: 'text',
        content: 'sellerRank',
        step: 0,
      },
      {
        sel: 'tbody tr:nth-child(4) td:nth-child(2)',
        parent: 'table.product-detail-table-right',
        type: 'text',
        content: 'totalOfferCount',
        step: 0,
      },
      {
        sel: 'tbody tr:nth-child(5) td:nth-child(2) kat-star-rating',
        parent: 'table.product-detail-table-right',
        type: 'value',
        content: 'a_rating',
        step: 0,
      },
      {
        sel: 'tbody tr:nth-child(5) td:nth-child(2) span.paddedLittle',
        parent: 'table.product-detail-table-right',
        type: 'text',
        content: 'a_reviewcnt',
        step: 0,
      },
      {
        sel: 'tr:nth-child(2) td:nth-child(5)',
        parent: 'table.product-detail-table-right tbody',
        type: 'text',
        content: 'a_prc',
        step: 0,
      },
      {
        sel: 'tbody tr:nth-child(5) td:nth-child(5)',
        parent: 'table.product-detail-table-right',
        type: 'text',
        content: 'buyBoxIsAmazon',
        step: 0,
      },
      // {
      //   sel: 'img',
      //   parent: 'div[id=product-detail-left]',
      //   type: 'src',
      //   content: 'a_img',
      //   step: 1,
      // },
      // {
      //   sel: 'thead tr td kat-link',
      //   parent: 'table.product-detail-table-left',
      //   type: 'label',
      //   content: 'name',
      //   step: 1,
      // },
      // {
      //   sel: 'tbody tr td:nth-child(2)',
      //   parent: 'table.product-detail-table-left',
      //   type: 'text',
      //   content: 'asin',
      //   step: 1,
      // },
      // {
      //   sel: 'tbody tr:nth-child(4) td:nth-child(2)',
      //   parent: 'table.product-detail-table-right',
      //   type: 'text',
      //   content: 'totalOfferCount',
      //   step: 1,
      // },
      {
        sel: 'span[part=label-text]',
        parent:
          'kat-box[id=ProgramCard]:nth-child(2) div.revenue-section kat-label.subsection-content-currency',
        type: 'text',
        shadowRoot: true,
        content: 'a_prc',
        step: 1,
      },
      // {
      //   sel: 'tbody tr:nth-child(3) td:nth-child(2)',
      //   parent: 'table.product-detail-table-right',
      //   type: 'text',
      //   content: 'sellerRank',
      //   step: 1,
      // },
      // {
      //   sel: 'tbody tr:nth-child(5) td:nth-child(2) kat-star-rating',
      //   parent: 'table.product-detail-table-right',
      //   type: 'value',
      //   content: 'a_rating',
      //   step: 1,
      // },
      // {
      //   sel: 'tbody tr:nth-child(5) td:nth-child(2) span.paddedLittle',
      //   parent: 'table.product-detail-table-right',
      //   type: 'text',
      //   content: 'a_reviewcnt',
      //   step: 1,
      // },
      // {
      //   sel: 'tbody tr:nth-child(5) td:nth-child(5)',
      //   parent: 'table.product-detail-table-right',
      //   type: 'text',
      //   content: 'buyBoxIsAmazon',
      //   step: 1,
      // },
      {
        sel: 'kat-label',
        parent: 'kat-expander div.section-expander-content',
        type: 'text',
        content: 'costs.azn',
        step: 1,
      },
      {
        sel: 'kat-label',
        parent:
          'kat-box[id=ProgramCard]:nth-child(2) kat-expander div.section-expander-content',
        type: 'text',
        content: 'costs.azn',
        step: 1.2,
      },
      {
        sel: 'kat-label',
        parent:
          'kat-expander div.section-expander-content div.input-block:nth-child(3)',
        type: 'text',
        content: 'costs.varc',
        step: 1,
      },
      {
        sel: 'kat-label',
        parent:
          'kat-box[id=ProgramCard]:nth-child(2) kat-expander div.section-expander-content div.input-block:nth-child(3)',
        type: 'text',
        content: 'costs.varc',
        step: 1.2,
      },
      {
        sel: 'kat-input',
        parent: 'kat-expander:nth-child(4)',
        type: 'value',
        content: 'tax',
        step: 1,
      },
      {
        sel: 'span[part=label-text]',
        parent: 'kat-expander:nth-child(2) div[slot=badge] kat-label',
        shadowRoot: true,
        type: 'text',
        content: 'costs.tpt',
        step: 1,
      },
      {
        sel: 'span[part=label-text]',
        parent: 'kat-expander:nth-child(3) div[slot=badge] kat-label',
        shadowRoot: true,
        type: 'text',
        content: 'costs.strg.1_hy',
        step: 1,
      },
      {
        sel: 'span[part=label-text]',
        parent: 'kat-expander:nth-child(3) div[slot=badge] kat-label',
        shadowRoot: true,
        type: 'text',
        content: 'costs.strg.2_hy',
        step: 2,
      },
    ],
    hasEan: false,
    leaveDomainAsIs: true,
    proxyType: 'mix',
    queryActions: [
      {
        type: 'shadowroot-button',
        sel: "kat-button[label='Als Gast fortfahren']",
        btn_sel: 'button',
        action: 'click',
        name: 'continue',
        step: 1,
        wait: false,
      },
      {
        type: 'shadowroot-button',
        sel: "kat-dropdown[label='Amazon Shop']",
        btn_sel: 'div.indicator',
        action: 'click',
        name: 'shop',
        step: 1,
        wait: false,
      },
      {
        type: 'button',
        sel: "kat-option[value='DE']",
        action: 'click',
        name: 'Select country',
        step: 1,
        wait: false,
      },
      {
        type: 'shadowroot-input',
        sel: "kat-input[label='Bei Amazon nach dem Produkt suchen']",
        input_sel: 'input',
        name: 'search',
        action: 'type',
        step: 1,
        wait: false,
        what: ['product.value'],
      },
      {
        type: 'shadowroot-button-test',
        sel: "kat-button[label='Suchen']",
        btn_sel: 'button',
        action: 'click',
        name: 'search',
        step: 1,
        wait: true,
      },
      {
        type: 'shadowroot-button-test',
        sel: 'kat-box[id=product-item] kat-button',
        btn_sel: 'button',
        name: 'select',
        action: 'click',
        step: 1,
        wait: true,
      },
      {
        type: 'shadowroot-input',
        sel: 'kat-box[id=ProgramCard]:nth-child(2) kat-input-group kat-input',
        input_sel: 'input',
        name: 'enter price',
        action: 'type',
        step: 1.2,
        wait: false,
        blur: true,
        clear: true,
        what: ['product.price'],
      },
      {
        type: 'shadowroot-button-test',
        sel: "kat-button[label='Oktober–Dezember']",
        btn_sel: 'button',
        name: 'select',
        action: 'click',
        waitDuration: 200,
        wait: false,
        step: 2,
      },
    ],
    queryUrlSchema: [
      {
        baseUrl: 'https://www.amazon.de/s?k=<query>&language=de_DE',
        category: 'default',
      },
    ],
    resourceTypes: {
      crawl: [
        'media',
        'font',
        // "stylesheet",
        'ping',
        'other',
        'image',
        // "xhr",
        // "fetch",

        // "script",
      ],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'sportspar.de': {
    actions: [],
    active: false,
    categories: {
      exclude: ['sparclub', 'service', 'marken', 'weitere'],
      sel: 'nav.navigation-main li.navigation--entry.is--active.has--sub-categories.js--menu-scroller--item',
      type: 'href',
      subCategories: [
        {
          sel: 'ul.sidebar--navigation li.navigation--entry > a.navigation--link.link--go-forward',
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'sportspar.de',
    entryPoints: [
      {
        url: 'https://www.sportspar.de',
        category: 'default',
      },
    ],
    manualCategories: [
      {
        name: 'Neuheiten',
        link: 'https://www.sportspar.de/neuheiten',
      },
      {
        name: 'Topseller',
        link: 'https://www.sportspar.de/topseller',
      },
      {
        name: 'Top-100',
        link: 'https://sportspar.de/top-100',
      },
    ],
    mimic: '#bToprow > div.row > div.col-logo > div > a > img',
    paginationEl: [
      {
        type: 'pagination',
        sel: 'a.btn.is--primary.is--icon-right.js--load-more',
        nav: '?p=',
        calculation: {
          method: 'match_text',
          textToMatch: 'Weitere Artikel laden',
          dynamic: true,
          last: 'a.btn.is--primary.is--icon-right.js--load-more',
          sel: 'a.btn.is--primary.is--icon-right.js--load-more',
        },
      },
    ],
    productList: [
      {
        sel: 'div.sr-resultList',
        productCntSel: [],
        product: {
          sel: 'div.sr-resultList div.sr-resultItemTile',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'div.sr-resultItemLink a',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'div.sr-resultItemTile__imageSection img.sr-resultItemTile__image',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'div.sr-productSummary__title',
              type: 'text',
            },
            {
              content: 'description',
              sel: 'div.sr-productSummary__description',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.sr-detailedPriceInfo__price',
              type: 'text',
            },
          ],
        },
      },
      {
        sel: 'div.offerList',
        productCntSel: [],
        product: {
          sel: 'div.offerList a.offerList-itemWrapper',
          type: 'link',
          details: [
            {
              content: 'image',
              sel: 'img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'div.offerList-item-description-title',
              type: 'text',
            },
            {
              content: 'description',
              sel: 'span.description-part-one',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.offerList-item-priceMin',
              type: 'text',
            },
          ],
        },
      },
    ],
    product: [],
    hasEan: true,
    proxyType: 'mix',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: [
        'media',
        'font',
        'stylesheet',
        'ping',
        'image',
        'xhr',
        'fetch',

        'script',
        'other',
      ],
    },
    waitUntil: {
      product: 'domcontentloaded',
      entryPoint: 'domcontentloaded',
    },
  },
  'thalia.de': {
    actions: [],
    active: true,
    categories: {
      exclude: [
        'buecher',
        'ebooks',
        'tolino',
        'hoerbuch',
        'marken',
        'club',
        'lehmanns',
        'gutschein',
        'geschenke',
        'zeitschriften',
      ],
      sel: 'nav.off-canvas.no-scrollbar li.item a[interaction=navigation-links]',
      type: 'href',
      visible: false,
      subCategories: [
        {
          visible: false,
          sel: 'nav.menu-container ul.menu-list li a',
          type: 'href',
        },
        {
          visible: false,
          sel: 'ul.logo-list li.logo-box a',
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'thalia.de',
    entryPoints: [
      {
        url: 'https://www.thalia.de',
        category: 'default',
      },
    ],
    manualCategories: [],
    mimic: 'header-prime-logo a',
    hasEan: true,
    paginationEl: [
      {
        type: 'pagination',
        sel: 'p.ergebnisanzeige',
        visible: false,
        nav: '?p=',
        calculation: {
          method: 'product_count',
          productsPerPage: 24,
          last: 'p.ergebnisanzeige',
          sel: 'p.ergebnisanzeige',
        },
      },
    ],
    productList: [
      {
        sel: 'ul.tm-produktliste',
        productCntSel: ['span.anzahl-treffer'],
        product: {
          sel: 'ul.tm-produktliste li.tm-produktliste__eintrag',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a.tm-produkt-link',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'picture img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'strong.tm-artikeldetails__titel',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.tm-artikeldetails span.tm-preis-wrapper__verkaufspreis',
              type: 'text',
            },
          ],
        },
      },
      {
        sel: 'suche-produktslider div.tm-produktliste-wrapper',
        productCntSel: ['span.anzahl-treffer'],
        product: {
          sel: 'suche-produktslider div.tm-produktliste-wrapper li.tm-produktliste__eintrag',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a.tm-produkt-link',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'picture img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'strong.tm-artikeldetails__titel',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.tm-artikeldetails span.tm-preis-wrapper__verkaufspreis',
              type: 'text',
            },
          ],
        },
      },
    ],
    product: [
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        path: 'gtin13',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'sku',
        path: 'sku',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'instock',
        path: 'offers.availability',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'price',
        path: 'offers.price',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'name',
        path: 'name',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'image',
        path: 'image[0]',
      },
    ],
    proxyType: 'mix',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: [
        'media',
        'font',
        'stylesheet',
        'ping',
        'image',
        'xhr',
        'fetch',

        'script',
        'other',
      ],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'kaufland.de': {
    actions: [],
    active: false,
    categories: {
      exclude: ['ratgeber'],
      sel: 'a.rh-menu-overlay__category',
      type: 'href',
      subCategories: [
        {
          sel: 'a:is(.rd-link.rd-tile,.btn.-primary)',
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'kaufland.de',
    entryPoints: [
      {
        url: 'https://www.kaufland.de',
        category: 'default',
      },
    ],
    manualCategories: [
      {
        name: 'B-Ware',
        link: 'https://www.kaufland.de/shops/kaufland_b-ware',
      },
      {
        name: 'Restposten',
        link: 'https://www.kaufland.de/campaigns/2019/kw_18/kw18_restposten',
      },
    ],
    mimic: 'span.svg-logo.rh-main__logo-normal svg',
    hasEan: true,
    paginationEl: [
      {
        type: 'pagination',
        initialUrl: {
          regexp: '\\\\u002Fcategory\\\\u002F\\d+\\\\u002F',
          type: 'encoded',
        },
        sel: 'nav.rd-pagination',
        nav: 'p',
        findPaginationStrategy: 'estimate',
        calculation: {
          method: 'estimate',
          productsPerPage: 35,
          last: 'nav.rd-pagination button.rd-page',
          sel: 'nav.rd-pagination button.rd-page',
        },
      },
    ],
    productList: [
      {
        sel: 'div.results.results--list',
        productCntSel: ['strong.product-count__products'],
        product: {
          sel: 'div.results.results--list a.product-link',
          type: 'link',
          details: [
            {
              content: 'image',
              sel: 'source',
              type: 'srcset',
            },
            {
              content: 'name',
              sel: 'div.product__title',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.price',
              type: 'text',
            },
          ],
        },
      },
      {
        sel: 'div.results.results--grid',
        productCntSel: ['strong.product-count__products'],
        product: {
          sel: 'div.results.results--grid a.product-link',
          type: 'link',
          details: [
            {
              content: 'image',
              sel: 'source',
              type: 'srcset',
            },
            {
              content: 'name',
              sel: 'div.product__title',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.price',
              type: 'text',
            },
          ],
        },
      },
    ],
    product: [],
    proxyType: 'mix',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: [
        'media',
        'font',
        'stylesheet',
        'ping',
        'image',
        'xhr',
        'fetch',

        'script',
        'other',
      ],
    },
    waitUntil: {
      product: 'domcontentloaded',
      entryPoint: 'domcontentloaded',
    },
  },
  'otto.de': {
    actions: [],
    active: true,
    allowedHosts: ['static.otto.de'],
    categories: {
      exclude: [
        'marken',
        'herren-mode',
        'ratgeber',
        'damen-mode',
        'mode',
        'inspiration',
        'marke',
      ],
      sel: 'ul.nav_desktop-global-navigation__content a',
      type: 'href',
      visible: false,
      subCategories: [
        {
          sel: 'ul.nav_local-links a.ts-link',
          visible: false,
          type: 'href',
        },
      ],
    },
    crawlActions: [
      {
        type: 'scroll',
        sel: 'none',
        name: 'Scroll to bottom',
        action: 'scroll',
      },
    ],
    d: 'otto.de',
    entryPoints: [
      {
        url: 'https://www.otto.de',
        category: 'default',
      },
    ],
    manualCategories: [],
    mimic: 'div.find_ottoLogo svg.pl_logo',
    hasEan: true,
    pauseOnProductPage: {
      pause: true,
      min: 700,
      max: 900,
    },
    paginationEl: [
      {
        type: 'pagination',
        sel: 'ul.reptile_paging.reptile_paging--bottom',
        nav: '?l=gp&o=<page>',
        paginationUrlSchema: {
          replace: 'attach_end',
          withQuery: false,
          calculation: {
            method: 'offset',
            offset: 120,
          },
        },
        calculation: {
          method: 'count',
          last: 'ul.reptile_paging.reptile_paging--bottom button',
          sel: 'ul.reptile_paging.reptile_paging--bottom button',
        },
      },
    ],
    productList: [
      {
        sel: 'section[id=reptile-tilelist]',
        productCntSel: ['span.reptile_tilelist__itemCount'],
        product: {
          sel: 'section[id=reptile-tilelist] article',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a.find_tile__productLink',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'img.find_tile__productImage',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'a.find_tile__productLink p.find_tile__name',
              type: 'text',
            },
            {
              content: 'mnfctr',
              sel: 'a.find_tile__productLink p.find_tile__brand',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'span.find_tile__retailPrice',
              type: 'text',
            },
          ],
        },
      },
    ],
    product: [
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        path: 'gtin13',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'sku',
        path: 'sku',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'instock',
        path: 'offers.availability',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'price',
        path: 'offers.price',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'name',
        path: 'name',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'image',
        path: 'image[0]',
      },
    ],
    proxyType: 'de',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: [
        'media',
        'font',
        // 'stylesheet',
        // 'ping',
        'image',
        'xhr',
        // 'fetch',
        // 'script',
        // 'other',
      ],
      product: [
        'media',
        'manifest',
        'font',
        'image',
        'xhr',
        'other',
        'ping',
        'fetch',
        'script',
        'stylesheet',
      ],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'pieper.de': {
    actions: [],
    active: true,
    categories: {
      exclude: ['wohntrends', 'marken', 'x-mas', 'pieper-rabattcode'],
      sel: 'div.navigation--list-wrapper ul li a',
      type: 'href',
      subCategories: [
        {
          visible: false,
          sel: 'div.emotion--html table a',
          type: 'href',
        },
        {
          visible: false,
          sel: 'li.navigation--entry.is--active ul.sidebar--navigation li a.navigation--link.link--go-forward',
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'pieper.de',
    entryPoints: [
      {
        url: 'https://www.pieper.de',
        category: 'default',
      },
    ],
    hasEan: true,
    manualCategories: [],
    mimic: 'div.logo--shop a picture',
    paginationEl: [
      {
        type: 'pagination',
        sel: 'a.js--load-more',
        findPaginationStrategy: 'estimate',
        wait: false,
        visible: false,
        nav: '?p=',
        calculation: {
          method: 'product_count',
          productsPerPage: 12,
          last: 'a.js--load-more',
          sel: 'a.js--load-more',
        },
      },
    ],
    pauseOnProductPage: {
      pause: true,
      min: 1200,
      max: 1500,
    },
    product: [
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'ean',
        path: 'gtin',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'sku',
        path: 'sku',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'instock',
        path: 'offers.availability',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'price',
        path: 'offers.price',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'mnfctr',
        path: 'brand.name',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'name',
        path: 'name',
      },
      {
        sel: "script[type='application/ld+json']",
        type: 'parse_json_element',
        content: 'image',
        path: 'image[0].url',
      },
    ],
    productList: [
      {
        sel: 'div.listing--container',
        productCntSel: [
          'div.category--headline span.category--headline-text',
          'div.category--headline-text',
        ],
        product: {
          sel: 'div.product--box',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'a.product--image',
              type: 'href',
            },
            {
              content: 'mnfctr',
              sel: 'span.product--manufacturer',
              type: 'text',
            },
            {
              content: 'image',
              sel: 'img',
              type: 'srcset',
            },
            {
              content: 'name',
              sel: 'a.product--image',
              type: 'title',
            },
            {
              content: 'price',
              sel: 'span.price--default',
              type: 'text',
            },
          ],
        },
      },
    ],
    proxyType: 'mix',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: ['media', 'font', 'ping', 'image', 'other'],
      product: [
        'media',
        'manifest',
        'font',
        'image',
        'xhr',
        'other',
        'ping',
        'fetch',
        'script',
        'stylesheet',
      ],
    },
    waitUntil: {
      product: 'load',
      entryPoint: 'load',
    },
  },
  'quelle.de': {
    actions: [],
    active: true,
    categories: {
      exclude: ['mode', 'arbeitskleidung', 'herren', 'damen', 'kinder'],
      sel: 'nav li a',
      visible: false,
      type: 'href',
      subCategories: [
        {
          sel: 'div.MuiGrid-root.MuiGrid-item.MuiGrid-grid-lg-1.css-15dky00 > ul > a',
          type: 'href',
        },
      ],
    },
    crawlActions: [],
    d: 'quelle.de',
    entryPoints: [
      {
        url: 'https://www.quelle.de',
        category: 'default',
      },
    ],
    manualCategories: [
      {
        name: 'Deals des Monats',
        link: 'https://www.quelle.de/themen-aktionen/sale/deals-des-monats',
      },
    ],
    mimic: 'header > div > a > svg',
    hasEan: true,
    paginationEl: [
      {
        type: 'pagination',
        sel: 'nav.MuiPagination-root',
        nav: '?p=',
        calculation: {
          method: 'count',
          last: 'nav.MuiPagination-root li',
          sel: 'nav.MuiPagination-root li',
        },
      },
    ],
    productList: [
      {
        sel: 'div.sr-resultList',
        productCntSel: ['ol.MuiBreadcrumbs-ol li:last-child'],
        product: {
          sel: 'div.sr-resultList div.sr-resultItemTile',
          type: 'not_link',
          details: [
            {
              content: 'link',
              sel: 'div.sr-resultItemLink a',
              type: 'href',
            },
            {
              content: 'image',
              sel: 'div.sr-resultItemTile__imageSection img.sr-resultItemTile__image',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'div.sr-productSummary__title',
              type: 'text',
            },
            {
              content: 'description',
              sel: 'div.sr-productSummary__description',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.sr-detailedPriceInfo__price',
              type: 'text',
            },
          ],
        },
      },
      {
        sel: 'div.offerList',
        productCntSel: ['ol.MuiBreadcrumbs-ol li:last-child'],
        product: {
          sel: 'div.offerList a.offerList-itemWrapper',
          type: 'link',
          details: [
            {
              content: 'image',
              sel: 'img',
              type: 'src',
            },
            {
              content: 'name',
              sel: 'div.offerList-item-description-title',
              type: 'text',
            },
            {
              content: 'description',
              sel: 'span.description-part-one',
              type: 'text',
            },
            {
              content: 'price',
              sel: 'div.offerList-item-priceMin',
              type: 'text',
            },
          ],
        },
      },
    ],
    product: [],
    proxyType: 'mix',
    queryActions: [],
    queryUrlSchema: [],
    resourceTypes: {
      crawl: [
        'media',
        'font',
        'stylesheet',
        'ping',
        'image',
        'xhr',
        'fetch',
        'script',
        'other',
      ],
    },
    waitUntil: {
      product: 'domcontentloaded',
      entryPoint: 'domcontentloaded',
    },
  },
};
