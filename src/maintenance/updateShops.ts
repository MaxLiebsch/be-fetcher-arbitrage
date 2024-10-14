import { insertShop } from "../db/util/shops.js";
import { shops } from "../shops.js";

const updateShops = async (shops: { [key: string]: any }) => {
  return Promise.all(
    Object.entries(shops).map(async ([key, val]) => {
      return await insertShop(val);
    })
  );
};

updateShops(shops).then((r) => {
  const completed = r.every(v=> v.acknowledged)
  if(!completed) process.exit(1);

  process.exit(0);
});
