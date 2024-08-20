import { getManufacturer, prefixLink } from "@dipmaxtech/clr-pkg";
import { createHash } from "./hash.js";

export const transformProduct = (crawlDataProduct, shopDomain) => {
  let product = { ...crawlDataProduct };
  let {
    name,
    hasMnfctr,
    mnfctr,
    price,
    link,
    promoPrice,
    dscrptnSegments,
    category,
    nmSubSegments,
    query,
    description,
    nameSub,
    locked,
    cat_locked,
    info_locked,
    eby_locked,
    vendor,
    candidates,
    ean,
    image,
  } = product;

  if (name) {
    let title = "";
    let mnfctr = "";
    if (hasMnfctr && mnfctr) {
      mnfctr = mnfctr;
      title = title;
    } else {
      const { mnfctr: _mnfctr, prodNm: _prodNm } = getManufacturer(name);
      mnfctr = _mnfctr;
      title = _prodNm;
    }
    product["nm"] = title;
    product["mnfctr"] = mnfctr;

    delete product.name;
  }
  if (price) {
    if (promoPrice) {
      product["prc"] = promoPrice;
    } else {
      product["prc"] = price;
    }
    delete product.price;
  }
  if (link) {
    product["lnk"] = prefixLink(link, shopDomain);
    product["s_hash"] = createHash(link);
    delete product.link;
  }

  if (image) {
    product["img"] = prefixLink(image, shopDomain);
    delete product.image;
  }
  if (ean) {
    product["eanList"] = [product.ean];
    delete product.ean;
  }
  if (category) {
    product["ctgry"] = product.category;
    delete product.category;
  }
  if (dscrptnSegments) {
    delete product.dscrptnSegments;
  }
  if (candidates) {
    delete product.candidates;
  }
  if (promoPrice === 0) {
    delete product.promoPrice;
  }
  if (description || description === "") {
    delete product.description;
  }
  if (nameSub || nameSub === "") {
    delete product.nameSub;
  }
  if (nmSubSegments || nmSubSegments === "") {
    delete product.nmSubSegments;
  }
  if (vendor || vendor === "") {
    delete product.vendor;
  }
  if (query) {
    delete product.query;
  }
  if (typeof eby_locked === "boolean") {
    delete product.eby_locked;
  }
  if (typeof info_locked === "boolean") {
    delete product.info_locked;
  }
  if (typeof cat_locked === "boolean") {
    delete product.cat_locked;
  }
  if (typeof locked === "boolean") {
    delete product.locked;
  }

  return product;
};
