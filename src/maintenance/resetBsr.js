import { getShop } from "../db/util/shops.js"

const main = async() => {
    const shops = await getShop('fressnapf')
    console.log('shops:', shops)

 }

 main().then()