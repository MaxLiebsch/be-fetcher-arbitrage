import {
  createCollection,
  wholeSaleColname,
} from "../db/mongo";

async function main() { 
  await createCollection('products');
}

main().then();
