import { describe, test, beforeAll } from '@jest/globals';
import { path, read } from 'fs-jetpack';
import queryEansOnEby from '../../src/services/queryEansOnEby';
import {
  aznUnsetProperties,
  ebyUnsetProperties,
  keepaProperties,
  LocalLogger,
  ObjectId,
} from '@dipmaxtech/clr-pkg';
import { setTaskLogger } from '../../src/util/logger';
import { TASK_TYPES } from '../../src/util/taskTypes';
import { resetProperty } from '../../src/maintenance/resetProperty';
import { shops } from '../../src/shops';
import { updateShops } from '../../src/db/util/shops';
import { emptyProductDb, insertProducts } from '../../src/db/util/crudProducts';

const shopDomain = 'gamestop.de';

describe('query eans on eby', () => {
  let productLimit = 10;
  beforeAll(async () => {
    await updateShops(shops);
    const products = read(
      path(
        'C:\\Users\\love\\Documents\\Projekts\\Arbitrage\\collections\\arbispotter.products-first20.json'
      ),
      'json'
    );

    if (!products) {
      throw new Error('No azn listings found for ' + shopDomain);
    }
    const cleanedProducts = products.reduce((acc, p) => {
      const product = {
        lnk: p.lnk,
        eanList: p.eanList,
        prc: p.prc,
        uprc: p.uprc,
        sdmn: p.sdmn,
        ean_prop: p.ean_prop,
        _id: new ObjectId(p._id.$oid),
      };
      acc.push(product);
      return acc;
    }, []);
    productLimit = products.length;
    console.log('products', products.length);
    await emptyProductDb();
    await insertProducts(cleanedProducts);
    await resetProperty({ $unset: { eby_prop: '', eby_taskId: '' } });
  }, 100000);

  test('query eans on eby', async () => {
    const logger = new LocalLogger().createLogger('QUERY_EANS_EBY');
    setTaskLogger(logger, 'TASK_LOGGER');
    //@ts-ignore
    const infos = await queryEansOnEby({
      concurrency: 4,
      type: TASK_TYPES.QUERY_EANS_EBY,
      id: 'queryEansOnEby',
      productLimit,
      _id: new ObjectId('60f3b3b3b3b3b3b3b3b3b3b3'),
      action: 'none',
    });
    console.log('infos:', infos);
  }, 1000000);
});
