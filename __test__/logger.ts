import { LocalLogger } from "@dipmaxtech/clr-pkg";
import { setTaskLogger } from "../src/util/logger";

const main = () => {
  const logger = new LocalLogger().createLogger("CRAWL_EAN");
  setTaskLogger(logger, "TASK_LOGGER");
};

main()
