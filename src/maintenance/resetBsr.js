import { getShop } from "../services/db/util/shops.js"
import { getActiveShops, getShops } from "../src/service/db/util/shops.js"

const main = async() => {
    const shops = await getShop('fressnapf')
    console.log('shops:', shops)

 }

 main().then()