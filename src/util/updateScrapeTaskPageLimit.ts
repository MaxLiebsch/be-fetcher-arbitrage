import { Limit } from '@dipmaxtech/clr-pkg';
import {
  COMPLETE_FAILURE_THRESHOLD,
  SAVEGUARD_INCREASE_PAGE_LIMIT_RUNAWAY_THRESHOLD,
} from '../constants.js';
import { ScrapeShopTaskUpdate } from '../types/tasks/Tasks.js';
import calculatePageLimit from './calculatePageLimit.js';

export function updateScrapeTaskPageLimit(
  total: number,
  limit: Limit,
  productLimit: number,
  update: ScrapeShopTaskUpdate
) {
  if (
    total > COMPLETE_FAILURE_THRESHOLD &&
    limit.pages <= SAVEGUARD_INCREASE_PAGE_LIMIT_RUNAWAY_THRESHOLD
  ) {
    const newPageLimit = calculatePageLimit(limit.pages, productLimit, total);
    update['limit'] = {
      ...limit,
      pages: newPageLimit,
    };
  }
}
