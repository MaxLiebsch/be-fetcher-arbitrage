import { describe, expect, test, beforeAll } from '@jest/globals';
import { path, read } from 'fs-jetpack';
import {
  deleteAllProducts,
  emptyProductDb,
  insertProducts,
} from '../../src/db/util/crudProducts';
import dealsOnEby from '../../src/services/deals/daily/dealsOnEby';
import { LocalLogger, ObjectId } from '@dipmaxtech/clr-pkg';
import { setTaskLogger } from '../../src/util/logger';
import { getAllShopsAsArray, updateShops } from '../../src/db/util/shops';
import { getProductsCol } from '../../src/db/mongo';
import { sub } from 'date-fns';
import { shops } from '../../src/shops.js';

const shopDomain = ['alternate.de', 'idealo.de', 'alza.de'];

describe('pos eby listings', () => {
  let productLimit = 30;
  beforeAll(async () => {
    await updateShops(shops);
    const products = read(
      path(
        'C:\\Users\\love\\Documents\\Projekts\\Arbitrage\\collections\\arbispotter.products-pos-eby-listings.json'
      ),
      'json'
    );

    if (!products) {
      throw new Error('No azn listings found for ' + shopDomain);
    }
    const cleanedProducts = products.reduce((acc, p) => {
      const product = {
        lnk: p.lnk,
        nm: p.nm,
        eanList: p.eanList,
        s_hash: p.s_hash,
        prc: p.prc,
        uprc: p.uprc,
        sdmn: p.sdmn,
        e_qty: p.e_qty,
        qty: p.qty,
        ean_prop: p.ean_prop,
        ebyCategories: p.ebyCategories,
        e_pblsh: true,
        e_costs:  p.e_costs,
        e_tax: p.e_tax,
        e_prc: p.e_prc, 
        e_uprc: p.e_uprc,
        e_mrgn: 20,
        e_mrgn_pct: 20,
        availUpdatedAt: sub(new Date(), { days: 2 }).toISOString(),
        updatedAt: sub(new Date(), { days: 10 }).toISOString(),
        createdAt: sub(new Date(), { days: 20 }).toISOString(),
        esin: p.esin,
        _id: new ObjectId(p._id.$oid),
      };
      acc.push(product);
      return acc;
    }, []);
    productLimit = products.length;
    console.log('products', products.length);
    await emptyProductDb();
    await insertProducts(cleanedProducts);
  }, 100000);

  test('pos eby listings', async () => {
    const logger = new LocalLogger().createLogger('DEALS_ON_EBY');
    setTaskLogger(logger, 'TASK_LOGGER');
    //@ts-ignore
    const infos = await dealsOnEby({
      productLimit,
      type: 'DEALS_ON_EBY',
      _id: new ObjectId('60f3b3b3b3b3b3b3b3b3b3b3'),
      action: 'none',
      concurrency: 4,
    });
    console.log('infos:', infos);
  }, 1000000);
});
