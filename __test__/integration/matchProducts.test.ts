import { describe, test, beforeAll } from '@jest/globals';
import { path, read } from 'fs-jetpack';
import matchProducts from '../../src/services/matchProducts';
import {
  LocalLogger,
  ObjectId,
  resetAznProductQuery,
  resetEbyProductQuery,
} from '@dipmaxtech/clr-pkg';
import { setTaskLogger } from '../../src/util/logger';
import {
  deleteAllProducts,
  insertProducts,
} from '../../src/db/util/crudProducts';
import {
  getCrawlDataCollection,
  getCrawlDataDb,
  getProductsCol,
} from '../../src/db/mongo';
import { MatchProductsTask } from '../../src/types/tasks/Tasks';

const shopDomain = 'cyberport.de';

describe('matchProducts', () => {
  let productLimit = 10;
  beforeAll(async () => {
    const products = read(
      path('__test__/static/collections/arbispotter.cyberport.de-match.json'),
      'json',
    );

    if (!products) {
      throw new Error('No azn listings found for ' + shopDomain);
    }
    console.log('products', products.length);
    await deleteAllProducts(shopDomain);
    await insertProducts(
      products.map((l) => {
        const id = l._id.$oid;
        delete l._id;
        return { ...l, _id: new ObjectId(id), sdmn: shopDomain };
      }),
    );
    const col = await getProductsCol();
    await col.updateMany(
      {
        sdmn: shopDomain,
      },
      {
        $unset: {
          ...resetEbyProductQuery().$unset,
          ...resetAznProductQuery().$unset,
          azn_prop: '',
        },
      },
    );
  }, 100000);

  test('match', async () => {
    const logger = new LocalLogger().createLogger('MATCH_PRODUCTS');
    setTaskLogger(logger, 'TASK_LOGGER');
    const db = await getCrawlDataCollection('tasks');
    const task = (await db.findOne({
      type: 'MATCH_PRODUCTS',
    })) as MatchProductsTask;
    if (!task) {
      throw new Error('No task found for MATCH_PRODUCTS');
    }
    task.productLimit = productLimit;
    const infos = await matchProducts(task);
    console.log('infos:', JSON.stringify(infos, null, 2));
  }, 1000000);
});
