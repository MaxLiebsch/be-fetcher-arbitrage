import { updateStats } from '../src/db/util/updateStats.js';

async function main() {
  const result = await updateStats();
  console.log('result:', JSON.stringify(result,null, 2));
}

main().then((r) => {
  process.exit(0);
});
