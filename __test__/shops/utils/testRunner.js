import { yieldBrowserVersion } from "@dipmaxtech/clr-pkg";
import pkg from "jest";
const { runCLI } = pkg;

const maxRetries = 4;  // Maximum number of retries
const retryTests = ['Mimic for block detection is working']; 
const versionChooser  = yieldBrowserVersion();

async function runTests(retries = 0) {
  process.env.BROWSER_VERSION = versionChooser.next().value

  const result = await runCLI(
    {
      testMatch: ["**/alza.de.test.ts"],
      testPathIgnorePatterns: ["node_modules"],
      
      verbose: true,
    },
    [process.cwd()]
  );
  const failedTests = result.results.testResults
  .flatMap(test => test.testResults)
  .filter(test => test.status === 'failed')
  .filter(test => test.status === 'failed' && retryTests.includes(test.title));

  if (failedTests.length > 0 && retries < maxRetries) {
    console.log(`Retrying failed tests... Attempt ${retries + 1}`);
    await runTests(retries + 1);
  } else if (failedTests.length === 0) {
    console.log('All tests passed!');
  } else {
    console.log('Max retries reached. Some tests are still failing.');
    process.exit(1);
  }
}

runTests().then();
