import { getCrawlDataDb, tasksCollectionName } from "../mongo.js";
import { findTasksQuery } from "./queries.js";
import { countPendingProductsForWholesaleSearch } from "./wholesaleSearch/getWholesaleProgress.js";
import { UTCDate } from "@date-fns/utc";
import { TASK_TYPES } from "../../util/taskTypes.js";
import { MatchProductsTask, Tasks } from "../../types/tasks/Tasks.js";
import { COOLDOWN, COOLDOWN_LONG } from "../../constants.js";
import { logGlobal } from "../../util/logger.js";
import { findPendingShops } from "./multiShopUtilities/findPendingShops.js";
import { findPendingShopsWithAgg } from "./multiShopUtilities/findPendingShopsWithAgg.js";
import { countPendingProducts } from "./multiShopUtilities/getTaskProgress.js";
import { handleComulativTasks, handleSingleTask } from "./tasks.js";

export const getNewTask = async (): Promise<Tasks | null | undefined> => {
    const { prioQuery, query, fallbackQuery, update } = findTasksQuery();
    const collectionName = tasksCollectionName;
    const db = await getCrawlDataDb();
    const taskCollection = db.collection<Tasks>(collectionName);
    const coolDownFactor = process.env.DEBUG ? 1000 * 60 * 2 : COOLDOWN;
    const cooldown = new Date(Date.now() + coolDownFactor).toISOString(); // 30 min in future
  
    const prioTask = await taskCollection.findOneAndUpdate(prioQuery, update, {
      returnDocument: "after",
    });
    console.log("Prioritytask: ", prioTask?.type || "no task");
    prioTask?.type &&
      logGlobal("Prioritytask:" + prioTask?.type + " " + prioTask?.id);
    if (prioTask) {
      if (prioTask.type === TASK_TYPES.DEALS_ON_EBY && "proxyType" in prioTask) {
        const { pendingShops, shops } = await findPendingShopsWithAgg(
          "DEALS_ON_EBY",
          prioTask.proxyType
        );
        logGlobal("DEALS_ON_EBY: pendingShops:" + pendingShops.length);
        return await handleComulativTasks(prioTask, pendingShops, cooldown);
      }
      if (prioTask.type === TASK_TYPES.DEALS_ON_AZN && "proxyType" in prioTask) {
        const { pendingShops, shops } = await findPendingShops(
          "DEALS_ON_AZN",
          prioTask.proxyType
        );
        logGlobal("DEALS_ON_AZN: pendingShops:" + pendingShops.length);
        return await handleComulativTasks(prioTask, pendingShops, cooldown);
      }
      return prioTask;
    }
  
    const primaryTask = await taskCollection.findOneAndUpdate(query, update, {
      returnDocument: "after",
    });
    primaryTask?.type &&
      logGlobal("Primary:task:" + primaryTask?.type + " " + primaryTask?.id);
    console.log("primaryTask ", primaryTask?.type || "no task");
    if (primaryTask) {
      if (primaryTask.type === TASK_TYPES.SCAN_SHOP) {
        return primaryTask;
      }
      if (primaryTask.type === TASK_TYPES.WHOLESALE_SEARCH) {
        const pending = await countPendingProductsForWholesaleSearch(
          primaryTask._id,
          "WHOLESALE_SEARCH"
        );
        logGlobal("WHOLESALE_SEARCH: pending:" + pending);
        return await handleSingleTask(primaryTask, pending, cooldown);
      }
      if (primaryTask.type === TASK_TYPES.WHOLESALE_EBY_SEARCH) {
        const pending = await countPendingProductsForWholesaleSearch(
          primaryTask._id,
          "WHOLESALE_EBY_SEARCH"
        );
        logGlobal("WHOLESALE_EBY_SEARCH: pending:" + pending);
        return await handleSingleTask(primaryTask, pending, cooldown);
      }
      if (
        primaryTask.type === TASK_TYPES.CRAWL_EAN &&
        "proxyType" in primaryTask
      ) {
        const { pendingShops, shops } = await findPendingShops(
          primaryTask.type as "CRAWL_EAN",
          primaryTask.proxyType
        );
        logGlobal("CRAWL_EAN: pendingShops:" + pendingShops.length);
        return await handleComulativTasks(primaryTask, pendingShops, cooldown);
      }
      if (primaryTask.type === TASK_TYPES.LOOKUP_INFO) {
        const { pendingShops, shops } = await findPendingShops("LOOKUP_INFO");
        logGlobal("LOOKUP_INFO: pendingShops:" + pendingShops.length);
        return await handleComulativTasks(primaryTask, pendingShops, cooldown);
      }
      if (primaryTask.type === TASK_TYPES.QUERY_EANS_EBY) {
        const { pendingShops, shops } = await findPendingShops("QUERY_EANS_EBY");
        logGlobal("QUERY_EANS_EBY: pendingShops:" + pendingShops.length);
        return await handleComulativTasks(primaryTask, pendingShops, cooldown);
      }
      if (primaryTask.type === TASK_TYPES.MATCH_PRODUCTS) {
        const domain = (primaryTask as MatchProductsTask).shopDomain;
        const pending = await countPendingProducts(
          domain,
          "MATCH_PRODUCTS",
          false
        );
        logGlobal("MATCH_PRODUCTS: pending:" + pending);
        return await handleSingleTask(primaryTask, pending, cooldown);
      }
      if (
        primaryTask.type === TASK_TYPES.NEG_AZN_DEALS &&
        "proxyType" in primaryTask
      ) {
        const { pendingShops, shops } = await findPendingShops(
          "NEG_AZN_DEALS",
          primaryTask.proxyType
        );
        logGlobal("NEG_AZN_DEALS: pendingShops:" + pendingShops.length);
        return await handleComulativTasks(primaryTask, pendingShops, cooldown);
      }
      if (
        primaryTask.type === TASK_TYPES.NEG_EBY_DEALS &&
        "proxyType" in primaryTask
      ) {
        const { pendingShops, shops } = await findPendingShopsWithAgg(
          "NEG_EBY_DEALS",
          primaryTask.proxyType
        );
        logGlobal("NEG_EBY_DEALS: pendingShops:" + pendingShops.length);
        return await handleComulativTasks(primaryTask, pendingShops, cooldown);
      }
      if (
        primaryTask.type === TASK_TYPES.LOOKUP_CATEGORY &&
        "proxyType" in primaryTask
      ) {
        const { pendingShops, shops } = await findPendingShops("LOOKUP_CATEGORY");
        logGlobal("LOOKUP_CATEGORY: pendingShops:" + pendingShops.length);
        return await handleComulativTasks(primaryTask, pendingShops, cooldown);
      }
    } else {
      //fallback
      const fallbackTask = await taskCollection.findOneAndUpdate(
        fallbackQuery,
        update,
        {
          returnDocument: "after",
        }
      );
      fallbackTask?.type &&
        logGlobal("Fallbacktask:" + fallbackTask?.type + " " + fallbackTask?.id);
  
      console.log("FallbackTask ", fallbackTask?.type || "no task");
      const coolDownFactor = process.env.DEBUG ? 1000 * 60 * 2 : COOLDOWN_LONG; // 60 min in future
      const cooldown = new UTCDate(Date.now() + coolDownFactor).toISOString();
      if (fallbackTask) {
        const { _id, type } = fallbackTask;
        if (type === TASK_TYPES.WHOLESALE_SEARCH) {
          const pending = await countPendingProductsForWholesaleSearch(
            _id,
            "WHOLESALE_SEARCH"
          );
          logGlobal("WHOLESALE_SEARCH: pending:" + pending);
          return await handleSingleTask(fallbackTask, pending, cooldown);
        }
        if (type === TASK_TYPES.WHOLESALE_EBY_SEARCH) {
          const pending = await countPendingProductsForWholesaleSearch(
            _id,
            "WHOLESALE_EBY_SEARCH"
          );
          logGlobal("WHOLESALE_EBY_SEARCH: pending:" + pending);
          return await handleSingleTask(fallbackTask, pending, cooldown);
        }
        if (type === TASK_TYPES.MATCH_PRODUCTS) {
          const shopProductCollectionName = (fallbackTask as MatchProductsTask)
            .shopDomain;
          const pending = await countPendingProducts(
            shopProductCollectionName,
            "MATCH_PRODUCTS",
            false
          );
          logGlobal("MATCH_PRODUCTS: pending:" + pending);
          return await handleSingleTask(fallbackTask, pending, cooldown);
        }
        if (type === TASK_TYPES.QUERY_EANS_EBY) {
          const { pendingShops, shops } = await findPendingShops(
            "QUERY_EANS_EBY"
          );
          logGlobal("QUERY_EANS_EBY: pendingShops:" + pendingShops.length);
          return await handleComulativTasks(fallbackTask, pendingShops, cooldown);
        }
        if (type === TASK_TYPES.CRAWL_EAN && "proxyType" in fallbackTask) {
          const { pendingShops, shops } = await findPendingShops(
            fallbackTask.type as "CRAWL_EAN",
            fallbackTask.proxyType
          );
          logGlobal("CRAWL_EAN: pendingShops:" + pendingShops.length);
          return await handleComulativTasks(fallbackTask, pendingShops, cooldown);
        }
        if (type === TASK_TYPES.NEG_AZN_DEALS && "proxyType" in fallbackTask) {
          const { pendingShops, shops } = await findPendingShops(
            "NEG_AZN_DEALS",
            fallbackTask.proxyType
          );
          logGlobal("NEG_AZN_DEALS: pendingShops:" + pendingShops.length);
          return await handleComulativTasks(fallbackTask, pendingShops, cooldown);
        }
        if (type === TASK_TYPES.NEG_EBY_DEALS && "proxyType" in fallbackTask) {
          const { pendingShops, shops } = await findPendingShopsWithAgg(
            "NEG_EBY_DEALS",
            fallbackTask.proxyType
          );
          logGlobal("NEG_EBY_DEALS: pendingShops:" + pendingShops.length);
          return await handleComulativTasks(fallbackTask, pendingShops, cooldown);
        }
        if (type === TASK_TYPES.CRAWL_EAN && "proxyType" in fallbackTask) {
          const { pendingShops, shops } = await findPendingShops(
            fallbackTask.type as "CRAWL_EAN",
            fallbackTask.proxyType
          );
          logGlobal("CRAWL_EAN: pendingShops:" + pendingShops.length);
          return await handleComulativTasks(fallbackTask, pendingShops, cooldown);
        }
        if (type === TASK_TYPES.LOOKUP_INFO) {
          const { pendingShops, shops } = await findPendingShops("LOOKUP_INFO");
          logGlobal("LOOKUP_INFO: pendingShops:" + pendingShops.length);
          return await handleComulativTasks(fallbackTask, pendingShops, cooldown);
        }
        if (type === TASK_TYPES.LOOKUP_CATEGORY) {
          const { pendingShops, shops } = await findPendingShops(
            "LOOKUP_CATEGORY"
          );
          logGlobal("LOOKUP_CATEGORY: pendingShops:" + pendingShops.length);
          return await handleComulativTasks(fallbackTask, pendingShops, cooldown);
        }
      }
      return null;
    }
  };
  