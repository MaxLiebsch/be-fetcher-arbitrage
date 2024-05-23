import { getActiveShops, getShops } from "../src/service/db/util/shops.js"

const main = async() => {
    const shops = await getActiveShops()
    console.log('shops:', shops)

 }

 main().then()