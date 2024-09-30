import {
  createArbispotterCollection,
  wholeSaleColname,
} from "../db/mongo";

async function main() { 
  await createArbispotterCollection('products');
}

main().then();
