import { recalculateAznMargin } from '@dipmaxtech/clr-pkg';
import { getProductsCol } from '../db/mongo.js';

async function recalculateMargin() {
  const col = await getProductsCol();

  const products = await col
    .find(
      {
        a_useCurrPrice: false,
        a_mrgn: { $gt: 0 },
        costs: { $exists: true },
      },
    )
    .toArray();

  for (let i = 0; i < products.length; i++) {
    const spotterUpdate = {};
    recalculateAznMargin(products[i], spotterUpdate);

    const result = await col.updateOne(
      { _id: products[i]._id },
      { $set: { ...spotterUpdate } },
    );
    console.log('result: ',products[i]._id,'... ' ,result.modifiedCount);
  }
}

recalculateMargin().then(() => {
  console.log('done');
  process.exit(0);
});
