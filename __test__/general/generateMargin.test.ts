import { calculateAznArbitrage, DbProductRecord, generateUpdate } from "@dipmaxtech/clr-pkg";
import { describe, test,  } from "@jest/globals";
import { findProduct } from "../../src/db/util/crudProducts.js";

describe("generate Margin", () => {

  test("#1", async () => {
    const product = await findProduct({ eanList: '5060173370558'})
    if(!product){
      throw new Error('Product not found')
    }

    const update = generateUpdate(
      [
        {
          key: 'a_img',
          value: 'https://m.media-amazon.com/images/I/41rHW7Jx6wL._SL120_.jpg'
        },
        {
          key: 'name',
          value: 'Tangle Teezer Blow-Styling Bürste Full Paddle, 1 Stück'
        },
        { key: 'asin', value: 'B0734WFLL5' },
        { key: 'totalOfferCount', value: '1 Angebote' },
        { key: 'a_prc', value: '1,00 €' },
        { key: 'sellerRank', value: '-' },
        { key: 'a_rating', value: '3.7' },
        { key: 'a_reviewcnt', value: '6' },
        { key: 'costs.azn', value: '0,30 €' },
        { key: 'costs.varc', value: '0,00 €' },
        { key: 'tax', value: '19' },
        { key: 'costs.tpt', value: '2,67 €' },
        { key: 'costs.strg.1_hy', value: '0,03 €' },
        { key: 'costs.azn', value: '6,88 €' },
        { key: 'costs.varc', value: '0,00 €' },
        { key: 'costs.strg.2_hy', value: '0,05 €' }
      ],
      product as unknown as DbProductRecord
    );
    console.log(update);
  });
});
