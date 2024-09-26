import { updateAllShopsStats } from "../db/util/updateShopStats";

async function main() {
  await updateAllShopsStats();
}

main().then((r) => process.exit(0));
