import { TaskCompletedStatus } from "../../status";
import { TaskCompletion } from "../../util/isTaskComplete";
import { DailySalesTask } from "../tasks/DailySalesTask";
import { ScrapeShopTask, Tasks } from "../tasks/Tasks";

export interface HandleTaskProps {
  taskResult: TaskCompletedStatus;
  completionStatus: TaskCompletion;
  priority: string;
  subject: string;
}

export interface DailySalesTaskProps extends HandleTaskProps {
  task: DailySalesTask;
}

export interface ScrapeShopTaskProps extends HandleTaskProps {
  task: ScrapeShopTask;
}

export interface CrawlEansTaskProps extends HandleTaskProps {
  task: Tasks;
}

export interface LookupInfoTaskProps extends HandleTaskProps {
  task: Tasks;
}

export interface LookupCategoryTaskProps extends HandleTaskProps {
  task: Tasks;
}

export interface QueryEansOnEbyTaskProps extends HandleTaskProps {
  task: Tasks;
}

export interface DealOnAznTaskProps extends HandleTaskProps {
  task: Tasks;
}

export interface DealOnEbyTaskProps extends HandleTaskProps {
  task: Tasks;
}

export interface NegAznDealTaskProps extends HandleTaskProps {
  task: Tasks;
}

export interface NegEbyDealTaskProps extends HandleTaskProps {
  task: Tasks;
}

export interface WholeSaleTaskProps extends HandleTaskProps {
  task: Tasks;
}

export interface MatchProductsTaskProps extends HandleTaskProps {
  task: Tasks;
}

export interface ScanTaskProps extends HandleTaskProps {
  task: Tasks;
}
