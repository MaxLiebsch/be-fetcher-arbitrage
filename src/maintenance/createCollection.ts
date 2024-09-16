import {
  createArbispotterCollection,
  wholesaleCollectionName,
} from "../db/mongo";

async function main() {
  console.log("test");
  console.log("wholesaleCollectionName:", wholesaleCollectionName);
  await createArbispotterCollection(wholesaleCollectionName);
}

main().then();
