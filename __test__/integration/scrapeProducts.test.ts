import { describe, expect, test, beforeAll } from "@jest/globals";
import { setTaskLogger } from "../../src/util/logger";
import { LocalLogger } from "@dipmaxtech/clr-pkg";
import scrapeShop from "../../src/services/scrapeShop";
import { sub } from "date-fns";
import { ScrapeShopTask } from "../../src/types/tasks/Tasks";

const shopDomain = "reichelt.de";

const today = new Date();
const productLimit = 150;
const yesterday = sub(today, { days: 1 });

const task = {
  _id: "661a785dc801f69f2beb16d9",
  type: "CRAWL_SHOP",
  id: `crawl_shop_${shopDomain}_1_of_4`,
  shopDomain,
  proxyType: "de",
  visitedPages: [],
  limit: {
    mainCategory: 9,
    subCategory: 100,
    pages: 50,
  },
  categories: [
    {
      name: "Strom- versorgung",
      link: "https://www.reichelt.de/de/de/stromversorgung-c1012.html?&nbc=1",
    },
    {
      name: "Messtechnik",
      link: "https://www.reichelt.de/de/de/messtechnik-c5868.html?&nbc=1",
    },
  ],
  recurrent: true,
  executing: false,
  completed: true,
  createdAt: "2024-04-13T12:19:41.168Z",
  startedAt: yesterday.toISOString(),
  completedAt: yesterday.toISOString(),
  productLimit,
  retry: 0,
  maintenance: false,
  lastCrawler: [],
  weekday: today.getDay(),
};

describe("crawlproducts", () => {
  test("lookup info listings", async () => {
    const logger = new LocalLogger().createLogger("CRAWL_SHOP");
    setTaskLogger(logger, "TASK_LOGGER");

    const infos = await scrapeShop(task as unknown as ScrapeShopTask);
    console.log(JSON.stringify(infos, null, 2));
  }, 1000000);
});
