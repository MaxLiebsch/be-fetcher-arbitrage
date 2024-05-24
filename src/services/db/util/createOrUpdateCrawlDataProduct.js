import {
  findCrawledProductByLink,
  updateCrawledProduct,
  upsertCrawledProduct,
} from "./crudCrawlDataProduct.js";

export const createOrUpdateCrawlDataProduct = async (domain, rawProd) => {
  const product = await findCrawledProductByLink(domain, rawProd.link);

  if (product) {
    const updatedProduct = {
      ...product,
      ...rawProd,
    };
    await updateCrawledProduct(domain, rawProd.link, updatedProduct);
  } else { 
    await upsertCrawledProduct(domain, rawProd);
  }
};
