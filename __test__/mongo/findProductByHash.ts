import { findProductByHash } from '../../src/db/util/crudProducts.js'

const main = async() => { 
    const product = await findProductByHash('8a2c87bb38ed096548e4c44a67565b35')
    console.log('product:', product)
 }

 main().then(() => console.log('done')).catch(console.error)