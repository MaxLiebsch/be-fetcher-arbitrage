import { createScanMatchTasks } from "../tasks.js";
import { newShops } from "./addNewShop.js";

async function main() {
  await createScanMatchTasks(
    newShops.map((shop) => shop.d),
    false
  );
}

main().then(r=> process.exit(0));
