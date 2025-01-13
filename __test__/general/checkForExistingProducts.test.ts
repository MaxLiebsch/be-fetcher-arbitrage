import { path, read } from 'fs-jetpack';
import { getCrawlDataCollection, getProductsCol } from '../../src/db/mongo.js';
import {
  emptyProductDb,
  insertProducts,
} from '../../src/db/util/crudProducts.js';
import { checkForExistingAznProducts } from '../../src/util/checkForExistingProducts.js';
import {
  aznUnsetProperties,
  DbProductRecord,
  keepaProperties,
  KeepaProperties,
  resetAznProductQuery,
} from '@dipmaxtech/clr-pkg';

const wholesaleProductsPath =
  'C:\\Users\\love\\Documents\\Projekts\\Arbitrage\\collections\\wholesale\\input.json';
const existingProductsPath =
  'C:\\Users\\love\\Documents\\Projekts\\Arbitrage\\collections\\wholesale\\existing.json';
const asineans =
  'C:\\Users\\love\\Documents\\Projekts\\Arbitrage\\collections\\wholesale\\asineans.json';

describe('checkForExistingProducts', () => {
  beforeAll(async () => {
    const eanAsinTable = await getCrawlDataCollection('asinean');
    await eanAsinTable.deleteMany({});
    await emptyProductDb();
    let wholeSaleProducts = read(path(wholesaleProductsPath), 'json');
    wholeSaleProducts = wholeSaleProducts.map((product: any) => {
      Object.keys(aznUnsetProperties).forEach((key) => {
        delete product[key];
      });

      delete product.info_prop
      delete product.infoUpdatedAt
  
      keepaProperties.forEach((key) => {
        delete product[key.name];
      })
      product.taskIds = ["6784dbfb996b7d680ea69af0"];
      product.a_lookup_pending = true;
      product.a_locked = false;
      return product;
    });
    console.log('wholeSaleProducts:', wholeSaleProducts.length);
    const existingProducts = read(path(existingProductsPath), 'json');
    console.log('existingProducts:', existingProducts.length);
    const asinEans = read(path(asineans), 'json');
    await eanAsinTable.insertMany(asinEans);
    await insertProducts(wholeSaleProducts);
    await insertProducts(existingProducts);
  });

  it('should check for existing products', async () => {
    // const col = await getProductsCol();
    // const wholesaleProducts = (await col
    //   .find({ taskIds: '677e53972914f3b39a1234fa' })
    //   .toArray()) as unknown as DbProductRecord[];
    // if (!wholesaleProducts) throw new Error('No wholesale products found');
    // console.log('wholesaleProducts:', wholesaleProducts.length);
    // const result = await checkForExistingAznProducts(wholesaleProducts);
    // expect(result.length).toBe(7);
  });
});
