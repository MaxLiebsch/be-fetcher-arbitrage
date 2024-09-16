import { findArbispotterProducts } from "../db/util/crudArbispotterProduct.js";

import {
  detectQuantity,
  getPacks,
  getPackung,
  getSIUints,
  parsePackQuantity,
} from "@dipmaxtech/clr-pkg";

import pkg from "fs-jetpack";
import { getActiveShops } from "../db/util/shops.js";
const { writeAsync, read, cwd } = pkg;
import { join } from "path";

const testDataWithPackage = [];
const testDataWithoutPackage = [];
const sampleSize = 10000;

const getTestdata = async () => {
  let hasMoreProducts = true;
  const batchSize = 300;
  const activeShops = await getActiveShops();
  return await Promise.all(
    activeShops.map(async (shop) => {
      let count = 0;
      let complete = false;
      hasMoreProducts = true;
      while (!complete) {
        const products = await findArbispotterProducts(
          shop.d,
          {
            nm: { $exists: true, $ne: "" },
          },
          batchSize
        );
        for (const p of products) {
          count++;
          const sample = {
            name: p.nm,
            qty: detectQuantity(p.nm),
            prc: p.prc,
            "---a---": "---a---",
            e_nm: p.e_nm ? p.e_nm : null,
            e_qty: p.e_nm ? detectQuantity(p.e_nm) : null,
            e_prc: p.e_prc ? p.e_prc : null,
            "---e---": "---e---",
            a_nm: p.a_nm ? p.a_nm : null,
            a_qty: p.a_nm ? detectQuantity(p.a_nm) : null,
            a_prc: p.a_prc ? p.a_prc : null,
            "---lnks---": "---lnks---",
            a_lnk: p.a_lnk ? p.a_lnk.split("?")[0] : null,
            e_lnk: p.e_lnk ? p.e_lnk.split("?")[0] : null,
            lnk: p.lnk,
          };
          if (sample.qty) {
            testDataWithPackage.push(sample);
          } else {
            testDataWithoutPackage.push(sample);
          }
        }
        hasMoreProducts = products.length === batchSize;
        if (count >= sampleSize || !hasMoreProducts) {
          complete = true;
        }
      }
    })
  );
};

getTestdata().then(async (r) => {
  await writeAsync(
    join(cwd(), "__test__/general/withPackage.json"),
    testDataWithPackage
  );
  await writeAsync(
    join(cwd(), "__test__/general/withoutPackage.json"),
    testDataWithoutPackage
  );
  process.exit(0);
});
