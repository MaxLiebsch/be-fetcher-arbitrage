import { sub } from "date-fns";

const testParameters = {
  "amazon.de": {
    productPageUrl:
      "https://www.amazon.de/dp/product/B0BZ9NMMW4?language=de_DE",
  },
  "ebay.de": {
    productPageUrl: "https://www.ebay.de/itm/256420198915",
  },
  "bergfreunde.de": {
    initialProductPageUrl: "https://www.bergfreunde.de/kletterschuhe/",
    productPageUrl:
      "https://www.bergfreunde.de/hunter-collar-convenience-hundehalsband/?cnid=7213b99a7a48b405e9410053d1d0f8b3",
    nextPageUrl: "https://www.bergfreunde.de/kletterschuhe/2",
  },
  "mueller.de": {
    initialProductPageUrl: "https://www.mueller.de/parfuemerie/duefte-fuer-sie/duftsets/",
    productPageUrl:
      "https://www.mueller.de/p/mjamjam-katzennassfutter-quetschie-insekt-mit-saftigem-huehnchen-IPN2912009/",
    nextPageUrl: "https://www.mueller.de/parfuemerie/duefte-fuer-sie/duftsets/?p=2",
  },
  "reichelt.de": {
    initialProductPageUrl:
      "https://www.reichelt.de/motorrad-rollerzubeh-r-c9921.html",
    productPageUrl:
      "https://www.reichelt.de/kfz-lufterfrischer-wunderbaum-kirsche-kfz-153206-p337369.html",
    nextPageUrl:
      "https://www.reichelt.de/motorrad-rollerzubeh-r-c9921.html?ACTION=2&GROUPID=9921&START=30&OFFSET=30&nbc=1",
  },
  "voelkner.de": {
    initialProductPageUrl: "https://www.voelkner.de/categories/13141_13250_13745/Multimedia/TV-Video/Fernseher.html",
    productPageUrl:
      "https://www.voelkner.de/products/1320099/Digitus-2-Port-Serielle-Steckkarte-Seriell-9pol.-PCI.html?offer=92b13922a56b1ef0318dab1bad8b94b8",
      nextPageUrl: "https://www.voelkner.de/categories/13141_13250_13745/Multimedia/TV-Video/Fernseher.html?page=2"
  },
  "alternate.de": {
    initialProductPageUrl: "https://www.alternate.de/Alle-Fernseher/4K-Fernseher",
    productPageUrl:
      "https://www.alternate.de/Duracell/AAAA-Ultra-M3-MN-2500-1-5V-Batterie/html/product/1219348",
      nextPageUrl: "https://www.alternate.de/Alle-Fernseher/4K-Fernseher?page=2"
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
  "thalia.de": {
    productsPerPage: 30,
    subCategoriesCount: 42,
    mainCategoriesCount: 18,
    initialProductPageUrl: "https://www.weltbild.de/buecher/dystopie",
    subCategoryUrl: "https://www.weltbild.de/buecher/dystopie",
    nextPageUrl: "https://www.weltbild.de/buecher/dystopie?seite=2",
  },
  "dm.de": {
    productPageUrl:
      "https://www.dm.de/nutrisse-haarfarbe-6n-nude-natuerliches-dunkelblond-p3600541901643.html",
    productsPerPage: 30,
    productsPerPageAfterLoadMore: 150,
    subCategoriesCount: 3,
    mainCategoriesCount: 12,
    initialProductPageUrl: "https://www.dm.de/ernaehrung/kaffee-tee-kakao",
    nextPageUrl: "https://www.dm.de/ernaehrung/kaffee-tee-kakao?currentPage0=2",
  },
  "mindfactory.de": {
    salesUrl: "https://www.mindfactory.de/DAMN",
    countProductPageUrl:
      "https://www.mindfactory.de/Hardware/Arbeitsspeicher+(RAM).html",
    pages: 20,
    productPageUrl:
      "https://www.mindfactory.de/product_info.php/Gigabyte-B760-Gaming-X-DDR4-Intel-B760-So--1700-Dual-Channel-DDR4-ATX--_1498196.html",
    productsPerPage: 60,
    productsPerPageAfterLoadMore: 20,
    subCategoriesCount: 46,
    mainCategoriesCount: 24,
    initialProductPageUrl:
      "https://www.mindfactory.de/Hardware/Arbeitsspeicher+(RAM).html",
    subCategoryUrl: "https://www.mindfactory.de/Hardware.html",
    nextPageUrl:
      "https://www.mindfactory.de/Hardware/Arbeitsspeicher+(RAM).html/page/2",
  },
  "galeria.de": {
    salesUrl: "https://www.galeria.de/sale",
    countProductPageUrl: "https://www.galeria.de/beauty/duefte",
    pages: 20,
    productPageUrl:
      "https://www.galeria.de/produkt/jean-paul-gaultier-gaultier-divine-le-parfum-eau-de-parfum-intense-refill-8435415091787",
    productsPerPage: 48,
    productsPerPageAfterLoadMore: 240,
    subCategoriesCount: 13,
    mainCategoriesCount: 7,
    initialProductPageUrl: "https://www.galeria.de/beauty/duefte",
    subCategoryUrl: "https://www.galeria.de/beauty",
    nextPageUrl: "https://www.galeria.de/beauty/duefte?page=2",
  },
  "euronics.de": {
    salesUrl: "https://www.euronics.de/angebote",
    countProductPageUrl:
      "https://www.euronics.de/computer-und-buero/tablets-und-ebook-reader/tablets",
    pages: 20,
    productPageUrl:
      "https://www.euronics.de/computer-und-buero/tablets-und-ebook-reader/tablets/ipad-air-11-128gb-wifi-2024-polarstern-4065327946451",
    productsPerPage: 24,
    productsPerPageAfterLoadMore: 20,
    subCategoriesCount: 14,
    mainCategoriesCount: 6,
    initialProductPageUrl:
      "https://www.euronics.de/computer-und-buero/tablets-und-ebook-reader/tablets",
    subCategoryUrl: "https://www.euronics.de/computer-und-buero/",
    nextPageUrl:
      "https://www.euronics.de/computer-und-buero/tablets-und-ebook-reader/tablets?p=2",
  },
  "galaxus.de": {
    salesUrl: "https://www.galaxus.de/de/sale",
    countProductPageUrl:
      "https://www.galaxus.de/de/s2/producttype/abfalleimer-348",
    pages: 20,
    productPageUrl:
      "https://www.galaxus.de/de/s2/product/curver-decobin-abfalleimer-40l-mit-druecker-silber-metallic-40-l-abfalleimer-23740383",
    productsPerPage: 98,
    productsPerPageAfterLoadMore: 49,
    subCategoriesCount: 28,
    mainCategoriesCount: 20,
    initialProductPageUrl:
      "https://www.galaxus.de/de/s2/producttype/abfalleimer-348",
    subCategoryUrl: "https://www.galaxus.de/de/s2/sector/haushalt-2",
    nextPageUrl:
      "https://www.galaxus.de/de/s2/producttype/abfalleimer-348?take=108",
  },
  "notebooksbilliger.de": {
    countProductPageUrl:
      "https://www.notebooksbilliger.de/pc+hardware/arbeitsspeicher+pc+hardware",
    pages: 20,
    productPageUrl:
      "https://www.notebooksbilliger.de/lexar+ares+rgb+32gb+kit+2x16gb+ddr5+6000+schwarz+856307",
    productsPerPage: 41,
    productsPerPageAfterLoadMore: 20,
    subCategoriesCount: 15,
    mainCategoriesCount: 21,
    initialProductPageUrl:
      "https://www.notebooksbilliger.de/pc+hardware/arbeitsspeicher+pc+hardware",
    subCategoryUrl: "https://www.notebooksbilliger.de/pc+hardware",
    nextPageUrl:
      "https://www.notebooksbilliger.de/pc+hardware/arbeitsspeicher+pc+hardware?page=2",
  },
  "notino.de": {
    countProductPageUrl: "https://www.notino.de/gesundheit/",
    pages: 20,
    productPageUrl:
      "https://www.notino.de/uriage/xemose-beruhigendes-reinigungsoel-fuer-gesicht-und-koerper/",
    productsPerPage: 25,
    productsPerPageAfterLoadMore: 25,
    subCategoriesCount: 5,
    mainCategoriesCount: 13,
    initialProductPageUrl: "https://www.notino.de/gesundheit/",
    subCategoryUrl: "https://www.notino.de/gesundheit/",
    nextPageUrl: "https://www.notino.de/gesundheit/?f=2-1-58633",
  },
  "flaconi.de": {
    countProductPageUrl: "https://www.flaconi.de/parfum/",
    pages: 20,
    productPageUrl:
      "https://www.flaconi.de/pflege/lancaster/sun-beauty/lancaster-sun-beauty-velvet-milk-sublime-tan-spf-30-sonnenlotion.html?variant=80002416-400",
    productsPerPage: 24,
    productsPerPageAfterLoadMore: 25,
    subCategoriesCount: 10,
    mainCategoriesCount: 9,
    initialProductPageUrl: "https://www.flaconi.de/parfum/",
    subCategoryUrl: "https://www.flaconi.de/parfum/",
    nextPageUrl: "https://www.flaconi.de/parfum/?offset=24",
  },
  "babymarkt.de": {
    countProductPageUrl: "https://www.babymarkt.de/kindersitze/",
    pages: 20,
    productPageUrl:
      "https://www.babymarkt.de/kindsgard-waschtuecher-vaskedag-12er-pack-oliv-a453313.html?intc=be/cat-A453313",
    productsPerPage: 33,
    productsPerPageAfterLoadMore: 33,
    subCategoriesCount: 14,
    mainCategoriesCount: 8,
    initialProductPageUrl: "https://www.babymarkt.de/kindersitze/",
    subCategoryUrl: "https://www.babymarkt.de/kindersitze/",
    nextPageUrl: "https://www.babymarkt.de/kindersitze/?page=2",
  },
  "conrad.de": {
    countProductPageUrl:
      "https://www.conrad.de/de/o/preisauszeichner-etiketten-2750010.html",
    pages: 20,
    productPageUrl:
      "https://www.conrad.de/de/p/logitech-wireless-k400-plus-funk-tastatur-deutsch-qwertz-schwarz-integriertes-touchpad-maustasten-1396292.html",
    productsPerPage: 30,
    productsPerPageAfterLoadMore: 30,
    subCategoriesCount: 14,
    mainCategoriesCount: 12,
    initialProductPageUrl:
      "https://www.conrad.de/de/o/preisauszeichner-etiketten-2750010.html",
    subCategoryUrl: "https://www.conrad.de/de/t/computer-buero-01.html",
    nextPageUrl:
      "https://www.conrad.de/de/o/preisauszeichner-etiketten-2750010.html?page=2",
  },
  "coolshop.de": {
    countProductPageUrl:
      "https://www.coolshop.de/videospiele-und-konsolen/playstation-4/games/",
    pages: 20,
    productPageUrl:
      "https://www.coolshop.de/produkt/ea-sports-fc-25-nordic/23N57J/",
    productsPerPage: 21,
    productsPerPageAfterLoadMore: 30,
    subCategoriesCount: 21,
    mainCategoriesCount: 15,
    initialProductPageUrl:
      "https://www.coolshop.de/videospiele-und-konsolen/playstation-4/games/",
    subCategoryUrl:
      "https://www.coolshop.de/videospiele-und-konsolen/playstation-4/games/",
    nextPageUrl:
      "https://www.coolshop.de/videospiele-und-konsolen/playstation-4/games/?page=2",
  },
  "proshop.de": {
    countProductPageUrl: "https://www.proshop.de/Mappenund-Clipboards",
    pages: 20,
    productPageUrl:
      "https://www.proshop.de/Mappenund-Clipboards/Oxford-Ring-Binder-Polyvision-A4-30mm-Spine-4-rings-translucent-Clear/2818492",
    productsPerPage: 25,
    productsPerPageAfterLoadMore: 25,
    subCategoriesCount: 27,
    mainCategoriesCount: 17,
    initialProductPageUrl: "https://www.proshop.de/Mappenund-Clipboards",
    subCategoryUrl: "https://www.proshop.de/Buero-und-Hobbyartikel",
    nextPageUrl: "https://www.proshop.de/Mappenund-Clipboards?pn=2",
  },
  "digitalo.de": {
    countProductPageUrl:
      "https://www.digitalo.de/categories/8179_8190_8293/Batterien-Kabel/Computerkabel-Zubehoer/Computernetzteile.html",
    pages: 20,
    productPageUrl:
      "https://www.digitalo.de/products/515702/LogiLink-CQ3041S-RJ45-Netzwerkkabel-Patchkabel-CAT-6a-S-FTP-1.50m-Weiss-Flammwidrig-mit-Rastnasenschutz-1St..html",
    productsPerPage: 24,
    productsPerPageAfterLoadMore: 24,
    subCategoriesCount: 48,
    mainCategoriesCount: 17,
    initialProductPageUrl:
      "https://www.digitalo.de/categories/8179_8190_8293/Batterien-Kabel/Computerkabel-Zubehoer/Computernetzteile.html",
    subCategoryUrl:
      "https://www.digitalo.de/categories/8179/Batterien-Kabel.html",
    nextPageUrl:
      "https://www.digitalo.de/categories/8179_8190_8293/Batterien-Kabel/Computerkabel-Zubehoer/Computernetzteile.html?page=2",
  },
  "fressnapf.de": {
    countProductPageUrl:
      "https://www.fressnapf.de/c/katze/katzenfutter/nassfutter/",
    pages: 20,
    productPageUrl:
      "https://www.fressnapf.de/p/tetra-reptomin-energy-250ml-1035195/",
    productsPerPage: 48,
    productsPerPageAfterLoadMore: 96,
    subCategoriesCount: 6,
    mainCategoriesCount: 11,
    initialProductPageUrl:
      "https://www.fressnapf.de/c/vogel/vogelfutter/",
    subCategoryUrl: "https://www.fressnapf.de/c/kleintier/",
    nextPageUrl:
      "https://www.fressnapf.de/c/vogel/vogelfutter/?currentPage=2",
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
      "https://www.gamestop.de/SearchResult/QuicksearchAjax?variantType=1&shippingMethod=2&typesorting=0&sdirection=ascending&skippos=48&takenum=24",
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
  "hornbach.de": {
    salesUrl: "",
    ean: "8712793561874",
    productPageUrl:
      "https://www.hornbach.de/p/differnz-waschtischarmatur-schwarz-matt-30-414-00/10289624/",
    productsPerPage: 72,
    productsPerPageAfterLoadMore: 50,
    subCategoriesCount: 5,
    mainCategoriesCount: 17,
    initialProductPageUrl:
      "https://www.hornbach.de/c/bad-sanitaer/badarmaturen/waschtischarmaturen/einhebel-waschtischarmatur/S32216/",
    subCategoryUrl:
      "https://www.hornbach.de/c/bad-sanitaer/badarmaturen/waschtischarmaturen/S3584/",
    nextPageUrl:
      "https://www.hornbach.de/c/bad-sanitaer/badarmaturen/waschtischarmaturen/einhebel-waschtischarmatur/S32216/?page=2",
  },
  "pieper.de": {
    salesUrl: "",
    ean: "4052136261660",
    productPageUrl:"https://www.pieper.de/artdeco-lippen-makeup-couture-lipstick-refill-1114468.html",
    productsPerPage: 60,
    productsPerPageAfterLoadMore: 50,
    subCategoriesCount: 14,
    mainCategoriesCount: 9,
    initialProductPageUrl:
      "https://www.pieper.de/make-up/",
    subCategoryUrl:
      "https://www.pieper.de/make-up/",
    nextPageUrl:
      "https://www.pieper.de/make-up/?p=2",
  },
  "rossmann.de": {
    salesUrl: "",
    ean: "5902751463774",
    productPageUrl:"https://www.rossmann.de/de/make-up-semilac-mineral-strong-base-coat-xxl/p/5902751463774",
    productsPerPage: 24,
    productsPerPageAfterLoadMore: 50,
    subCategoriesCount: 19,
    mainCategoriesCount: 9,
    initialProductPageUrl:
      "https://www.rossmann.de/de/pflege-und-duft/c/olcat1_2325036",
    subCategoryUrl:
      "https://www.rossmann.de/de/pflege-und-duft/c/olcat1_2325036",
    nextPageUrl:
      "https://www.rossmann.de/de/pflege-und-duft/c/olcat1_2325036?q=%3Arelevance%3A&page=1&pageSize=24#",
  },
  "aldi-onlineshop.de": {
    salesUrl: "https://www.aldi-onlineshop.de/aktionen/",
    ean: "4260280775081",
    productPageUrl:"https://www.aldi-onlineshop.de/p/bepflanzbare-muelltonnenbox-edelstahl-2-x-240-l-101011113/",
    productsPerPage: 24,
    productsPerPageAfterLoadMore: 50,
    subCategoriesCount: 10,
    mainCategoriesCount: 7,
    initialProductPageUrl:
      "https://www.aldi-onlineshop.de/c/garten-2/",
    subCategoryUrl:
      "https://www.aldi-onlineshop.de/c/garten-2/",
    nextPageUrl:
      "https://www.aldi-onlineshop.de/c/garten-2/?page=2",
  },
  "allesfuerzuhause.de": {
    salesUrl: "https://allesfuerzuhause.de/sale/",
    ean: "8806095414997",
    productPageUrl:"https://allesfuerzuhause.de/product/samsung-gq77s95dat-5247258/",
    productsPerPage: 16,
    productsPerPageAfterLoadMore: 32,
    subCategoriesCount: 10,
    mainCategoriesCount: 11,
    initialProductPageUrl:
      "https://allesfuerzuhause.de/tv-audio/tv-geraete/",
    subCategoryUrl:
      "https://allesfuerzuhause.de/tv-audio/",
    nextPageUrl:
      "https://allesfuerzuhause.de/tv-audio/tv-geraete/#?comID=l15$c1$c3$c1&pix=1&ajaxtargets=product-grid",
  },
};

export default testParameters;
