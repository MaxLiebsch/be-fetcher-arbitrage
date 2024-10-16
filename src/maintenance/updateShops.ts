import { updateShops } from "../db/util/shops.js";
import { shops } from "../shops.js";

updateShops(shops).then((r) => {
  const completed = r.every(v=> v.acknowledged)
  if(!completed) process.exit(1);

  process.exit(0);
});
