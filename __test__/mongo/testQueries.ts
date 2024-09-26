import { countProductsPerCategoryAzn, countProductsPerCategoryEby} from "@dipmaxtech/clr-pkg";
import { getArbispotterDb } from "../../src/db/mongo.js";
const testQueries = async () => {
  const domain = "idealo.de";
  const aggregation = countProductsPerCategoryAzn;

  const db = await getArbispotterDb();

  console.log("aggregation:", aggregation);

  const res = await db.collection(domain).aggregate(aggregation).toArray();
  const reducedToObjectEby = res.reduce((acc, category) => {
    const entry = Object.entries(category)[0];
    return {
      ...acc,
      [entry[0]]: entry[1],
    };
  }, {})
};

testQueries().then((r) => {
  process.exit(0);
});
