import { DbProductRecord, ObjectId } from '@dipmaxtech/clr-pkg';
import { getProductsCol } from '../db/mongo.js';
import { parseISO } from 'date-fns';
import { getAllShops, getShops } from '../db/util/shops.js';

const findDuplicates = async (shopDomain: string = '') => {
  const col = await getProductsCol();
  return col
    .aggregate([
      //   {
      //     $match: {
      //       sdmn: shopDomain,
      //     },
      //   },
      {
        $group: {
          _id: '$lnk',
          count: { $sum: 1 },
          docs: { $push: { _id: '$_id', createdAt: '$createdAt' } },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
    ])
    .toArray();
};

type Agg = {
  _id: string;
  count: number;
  docs: Doc[];
};

type Doc = {
  _id: ObjectId;
  createdAt: string;
};

const removeDuplicates = async (foundDuplicates: Agg[]) => {
  const col = await getProductsCol();
  let cnt = 0;

  for (const { docs } of foundDuplicates) {
    cnt++;
    const sorted = docs.sort(
      (a: Doc, b: Doc) =>
        parseISO(a.createdAt).getTime() - parseISO(b.createdAt).getTime()
    );
    const remove = sorted.slice(1).map((doc: Doc) => doc._id);

    await col.deleteMany({
      _id: { $in: remove },
    });
    console.log(`(${cnt}/${foundDuplicates.length})`);
  }
};

let stats: { [key: string]: number } = {};

const main = async () => {
  const shops = await getAllShops();
  if (!shops) return;

  const domain = 'all';
  const duplicates = (await findDuplicates(domain)) as Agg[];
  stats[domain] = duplicates.length;
  console.log(domain, 'TOTAL DUPLICATES:', duplicates.length);
  await removeDuplicates(duplicates);
  //   for (const shop of shops) {
  //   }
};

main().then((r) => console.log(stats));
