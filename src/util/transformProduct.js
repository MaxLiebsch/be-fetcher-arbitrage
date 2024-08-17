export const transformProduct = (crawlDataProduct) => {
  let product = { ...crawlDataProduct };
  if (product.name) {
    product["nm"] = product.name;
    delete product.name;
  }
  if (product.price) {
    product["prc"] = product.price;
    delete product.price;
  }
  if (product.link) {
    product["lnk"] = product.link;
    delete product.link;
  }
  if (product.image) {
    product["img"] = product.image;
    delete product.image;
  }
  if (product.ean) {
    product["eanList"] = [product.ean];
    delete product.ean;
  }
  if (product.category) {
    product["ctgry"] = product.category;
    delete product.category;
  }
  if (product.dscrptnSegments) {
    delete product.dscrptnSegments;
  }
  if (product.candidates) {
    delete product.candidates;
  }
  if (product.promoPrice === 0) {
    delete product.promoPrice;
  }
  if (product.description || product.description === "") {
    delete product.description;
  }
  if (product.nameSub || product.nameSub === "") {
    delete product.nameSub;
  }
  if (product.nmSubSegments || product.nmSubSegments === "") {
    delete product.nmSubSegments;
  }
  if (product.vendor || product.vendor === "") {
    delete product.vendor;
  }
  if (product.query) {
    delete product.query;
  }
  if (typeof product.locked === "boolean") {
    delete product.info_locked;
  }
  if (typeof product.locked === "boolean") {
    delete product.cat_locked;
  }
  if (typeof product.locked === "boolean") {
    delete product.locked;
  }

  return product;
};
