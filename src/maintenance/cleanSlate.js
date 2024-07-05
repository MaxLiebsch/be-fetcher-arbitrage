import {
  createArbispotterCollection,
  createCrawlDataCollection,
  getArbispotterDb,
  getCrawlDataDb,
} from "../services/db/mongo.js";
import {
  findArbispotterProducts,
  updateArbispotterProduct,
} from "../services/db/util/crudArbispotterProduct.js";
import { createOrUpdateCrawlDataProduct } from "../services/db/util/createOrUpdateCrawlDataProduct.js";
import { findCrawlDataProducts } from "../services/db/util/crudCrawlDataProduct.js";
import { createOrUpdateArbispotterProduct } from "../services/db/util/createOrUpdateArbispotterProduct.js";

const cleanSlate = async () => {
  const db = await getCrawlDataDb();
  const keep = [
    "grave",
    "shops",
    "alternate.de",
    "alternate.de.products",
    "wholesale",
    "tasks",
    "errors",
    "asinean",
    "logs",
    "sitemaps",
  ];
  // const collections = await db.collections();
  // for (const collection of collections) {
  //   if (!keep.includes(collection.collectionName)) {
  //     const newCollectionName = collection.collectionName.replace(
  //       ".products",
  //       ""
  //     );
  //     const result = await createCrawlDataCollection(newCollectionName);
  //     await db.dropCollection(collection.collectionName);
  //     if (result) {
  //       console.log("newCollectionName:", newCollectionName);
  //     }
  //   }
  // }

  // const spotterdb = await getArbispotterDb();
  // const spotterCollections = await spotterdb.collections();
  // for (const collection of spotterCollections) {
  //   if (!keep.includes(collection.collectionName)) {
  //     await spotterdb.dropCollection(collection.collectionName);
  //     const newCollectionName = collection.collectionName.replace(
  //       ".products",
  //       ""
  //     );
  //     const result = await createArbispotterCollection(newCollectionName);
  //     if (result) {
  //       console.log("newCollectionName:", newCollectionName);
  //     }
  //   }
  // }

  const shop = {
    d: "alternate.de",
  };
  let hasMoreProducts = true;
  const batchSize = 20;
  let completed = 0;
  // while (hasMoreProducts) {
  //   const products = await findCrawlDataProducts(
  //     shop.d + ".products",
  //     {},
  //     batchSize
  //   );
  //   if (products.length) {
  //     for (let index = 0; index < products.length; index++) {
  //       const p = products[index];
  //       completed++;
  //       const creation = await createOrUpdateCrawlDataProduct(shop.d, p);
  //       if (creation.acknowledged) {
  //         const deletion = await db
  //           .collection(shop.d + ".products")
  //           .deleteOne({ _id: p._id });
  //         if (deletion.acknowledged) {
  //           console.log(p._id, "moved.");
  //         }
  //       }
  //     }
  //     console.log(`Moved in ${completed} products for ${shop.d}`);
  //   } else {
  //     console.log(`No updates needed in shop ${shop.d}`);
  //   }
  //   hasMoreProducts = products.length === batchSize;
  // }

  completed = 0;
  hasMoreProducts = true;
  while (hasMoreProducts) {
    const products = await findArbispotterProducts(shop.d, {}, batchSize);
    if (products.length) {
      for (let index = 0; index < products.length; index++) {
        const p = products[index];
        completed++;
        const creation = await createOrUpdateArbispotterProduct(
          shop.d + ".tmp",
          p
        );
        if (creation.acknowledged) {
          const deletion = await db
            .collection(shop.d)
            .deleteOne({ _id: p._id });
          if (deletion.acknowledged) {
            console.log(p._id, "moved.");
          }
        }
      }
      console.log(`Moved in ${completed} products for ${shop.d}`);
    } else {
      console.log(`No updates needed in shop ${shop.d}`);
    }
    hasMoreProducts = products.length === batchSize;
  }
};

cleanSlate().then((r) => {
  process.exit(0);
});
