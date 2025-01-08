import {
  calculateEbyArbitrage,
  DbProductRecord,
  findMappedCategory,
  Product,
  QueryQueue,
  replaceAllHiddenCharacters,
  roundToTwoDecimals,
  resetEbyProductQuery,
} from '@dipmaxtech/clr-pkg';

import {
  updateProducts,
  updateProductWithQuery,
} from '../db/util/crudProducts.js';
import { calculateMinMaxMedian } from './calculateMinMaxMedian.js';
import { QueryEansOnEbyStats } from '../types/taskStats/QueryEansOnEbyStats.js';
import { DailySalesTask } from '../types/tasks/DailySalesTask.js';
import { log } from './logger.js';
import { WholeSaleEbyTask } from '../types/tasks/Tasks.js';
import { TASK_TYPES } from './taskTypes.js';
import { wholeSaleNotFoundQuery } from './wholeSales.js';
import { getEanFromProduct } from './getEanFromProduct.js';
import { TaskStats } from '../types/taskStats/TasksStats.js';
import { defaultEbyDealTask } from '../constants.js';

const handleOtherProducts = async (
  ean: string,
  update: any,
  errorMessage: string
) => {
  const result = await updateProducts(
    {
      eanList: ean,
    },
    {
      ...update,
    }
  );

  if (result.modifiedCount > 0) {
    log(errorMessage);
  }
};

export async function handleScrapeTotalOffersIsFinished({
  shopDomain,
  queue,
  product,
  infos,
  foundProducts,
  task = null,
  processProps,
}: {
  shopDomain: string;
  queue: QueryQueue;
  product: DbProductRecord;
  infos: TaskStats;
  foundProducts: Product[];
  task: DailySalesTask | WholeSaleEbyTask | null;
  processProps: typeof defaultEbyDealTask;
}) {
  const {
    e_qty: sellQty,
    ebyCategories,
    e_costs,
    prc: buyPrice,
    qty: buyQty,
    _id: productId,
  } = product;

  const isWholeSaleEbyTask = task?.type === TASK_TYPES.WHOLESALE_EBY_SEARCH;

  let update: Partial<DbProductRecord> = {};
  const priceRange = calculateMinMaxMedian(foundProducts);
  const foundProduct = foundProducts.reduce(
    (cheapest, current) => {
      const { price, link, name } = current;
      if (
        (!cheapest || (price && price <= cheapest.price)) &&
        (!priceRange.median || (price && price <= priceRange.median)) &&
        link &&
        name
      ) {
        return current;
      }
      return cheapest;
    },

    null as Product | null
  );
  if (foundProduct) {
    const { image, name, link } = foundProduct;
    const esin = new URL(link).pathname.split('/')[2];

    if (priceRange.min && priceRange.max) {
      update['e_pRange'] = priceRange;
    }
    const sellPrice = priceRange.median!; // median price

    update['e_totalOfferCount'] = foundProducts.length;
    update['e_orgn'] = 'e';
    update['esin'] = esin;
    update['e_nm'] = replaceAllHiddenCharacters(name);

    if (sellQty) {
      update['e_qty'] = sellQty;
      update['e_uprc'] = roundToTwoDecimals(sellPrice / sellQty);
    } else {
      update['e_qty'] = 1;
      update['e_uprc'] = sellPrice;
    }

    if (ebyCategories && ebyCategories.length > 0 && e_costs) {
      const mappedCategory = findMappedCategory(
        ebyCategories!.reduce<number[]>((acc, curr) => {
          acc.push(curr.id);
          return acc;
        }, [])
      );
      if (mappedCategory) {
        const ebyArbitrage = calculateEbyArbitrage(
          mappedCategory,
          sellPrice, //VK
          buyPrice * (sellQty! / buyQty) //EK  //QTY Zielshop/QTY Herkunftsshop
        );
        if (ebyArbitrage) {
          Object.entries(ebyArbitrage).forEach(([key, val]) => {
            (update as any)[key] = val;
          });
        }
      }
    }

    update = {
      ...update,
      [processProps.timestamp]: new Date().toISOString(),
    };
    const ean = getEanFromProduct(product);

    if (ean) {
      await handleOtherProducts(
        ean,
        {
          $set: {
            ...update,
            [processProps.timestamp]: new Date().toISOString(),
          },
          $unset: {
            [processProps.taskIdProp]: '',
          },
        },
        `Updated multipe products ${shopDomain}-${productId}`
      );
    }

    const result = await updateProductWithQuery(productId, {
      $set: {
        ...update,
      },
      $unset: {
        [processProps.taskIdProp]: '',
      },
    });
    log(`Updated: ${shopDomain}-${productId}`, result);
    if (task) task.progress.lookupCategory.push(productId);
  } else {
    let query = {};
    if (isWholeSaleEbyTask) {
      query = wholeSaleNotFoundQuery;
    } else {
      query = resetEbyProductQuery({ eby_prop: 'missing', cat_prop: '' });
      const ean = getEanFromProduct(product);
      if (ean) {
        await handleOtherProducts(
          ean,
          query,
          `Updated multipe products ${shopDomain}-${productId}`
        );
      }
    }
    const result = await updateProductWithQuery(productId, query);
    log(`No product found for ${shopDomain}-${productId}`, result);
  }
  infos.total++;
  queue.total++;
}
