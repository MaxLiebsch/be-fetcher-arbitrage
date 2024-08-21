# Sales

- [x] keepa integration for sales
- [x] handle retries
- [x] use limit from browserConfig in crawlShop fn
- [x] update stats
- [x] update limit in browserConfig.crawlShop
- [x] add sales to active shops
- [x] tasks in test_tasks uebertragen


# remove doppelte Datenhaltung

- [x] crawl && tested
- [x] aznlisting
- [x] crawlAznListingsWithSellercentral
- [x] crawlean
- [x] ebylisting
- [x] queryEansOnEby
- [x] lookupCategory
- [x] lookupinfo
- [x] match
- [x] productPriceComperator
- [x] scan
- [x] wholesale
- [x] turn off server
- [x] data migration
    eanUpdatedAt set to today
    infoUpdatedAt set to aznUpdatedAt
    recover asin
    ESIN updated which process picks it up?
    unset all lckd, locked props

# cron-jobs 
- [x] reset info_prop / ean_prop / eby_prop / cat_prop after two weeks


- [x] infinit loop in scrapeProductPrice when only one product is found.