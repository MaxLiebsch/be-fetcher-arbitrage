import { DbProductRecord } from '@dipmaxtech/clr-pkg';
import { getEanFromProduct } from './getEanFromProduct.js';

export const eansReduce = (products: DbProductRecord[]) =>
  products.reduce<string[]>((eans, product) => {
    const ean = getEanFromProduct(product);
    if (ean) {
      eans.push(ean);
    }
    return eans;
  }, []);
