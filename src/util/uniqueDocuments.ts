import { ObjectId, TaskTypes } from '@dipmaxtech/clr-pkg';
import { ProductsAndShop } from '../types/products.js';
import { TaskIds } from './taskTypes.js';
import { log } from './logger.js';
import { getProductsCol } from '../db/mongo.js';

export async function uniqueDocuments(
  taskType: TaskTypes,
  productAndShops: ProductsAndShop,
  taskId: ObjectId
): Promise<ProductsAndShop> {
  const idsToReturn: ObjectId[] = [];
  // Filter unique documents based on eanList[0]zz
  const uniqueEanSet = new Set<string>();
  const uniqueDocuments = productAndShops.products.filter((doc) => {
    if (!doc.product.eanList || doc.product.eanList.length === 0) {
      return true;
    }
    const ean = doc.product.eanList[0];
    if (uniqueEanSet.has(ean)) {
      idsToReturn.push(doc.product._id);
      return false;
    } else {
      uniqueEanSet.add(ean);
      return true;
    }
  });

  if (idsToReturn.length > 0) {
    // Return the duplicate documents
    const col = await getProductsCol();
    const id = TaskIds[taskType];
    const result = await col.updateMany(
      { _id: { $in: idsToReturn } },
      { $unset: { [id]: '' } }
    );
    log(
      `Task ${taskType} ${taskId} has ${idsToReturn.length} duplicate eanList[0] documents. ${result.modifiedCount} reseted.`
    );
  }

  return { products: uniqueDocuments, shops: productAndShops.shops };
}
