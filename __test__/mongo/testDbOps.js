import { findCrawledProductByLink } from "../../src/services/db/util/crudCrawlDataProduct.js";

const main = async () => {
  findCrawledProductByLink(
    "alternate.de",
    "https://www.alternate.de/Therm-a-Rest/NeoAir-Venture-Regular-13270-Camping-Matte/html/product/1716252"
  ).then((result) => {
    console.log(result);
  });
};

main().then();
