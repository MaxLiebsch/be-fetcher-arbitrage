import { ProxyType, QueueStats } from "@dipmaxtech/clr-pkg";

export const combineQueueStats = (queueStats: QueueStats[]) =>
  queueStats.reduce(
    (acc: QueueStats, stats: QueueStats) => {
      // Accumulate proxyTypes
      (Object.keys(stats.proxyTypes) as any).forEach(
        (key: keyof typeof stats.proxyTypes) => {
          if (acc.proxyTypes[key]) {
            acc.proxyTypes[key] += stats.proxyTypes[key];
          } else {
            acc.proxyTypes[key] = stats.proxyTypes[key];
          }
        }
      );

      // Accumulate visitedPages
      acc.visitedPages = acc.visitedPages.concat(stats.visitedPages);

      // Accumulate errorTypeCount
      Object.keys(stats.errorTypeCount).forEach(
        (key: keyof typeof stats.errorTypeCount) => {
          if (acc.errorTypeCount[key]) {
            acc.errorTypeCount[key] += stats.errorTypeCount[key];
          } else {
            acc.errorTypeCount[key] = stats.errorTypeCount[key];
          }
        }
      );

      // Accumulate estimatedProducts
      acc.estimatedProducts += stats.estimatedProducts;

      // Accumulate statusHeuristic
      (Object.keys(stats.statusHeuristic) as any).forEach(
        (key: keyof typeof stats.statusHeuristic) => {
          if (acc.statusHeuristic[key]) {
            acc.statusHeuristic[key] += stats.statusHeuristic[key];
          } else {
            acc.statusHeuristic[key] = stats.statusHeuristic[key];
          }
        }
      );

      // Accumulate retriesHeuristic
      (Object.keys(stats.retriesHeuristic) as any).forEach(
        (key: keyof typeof stats.retriesHeuristic) => {
          if (acc.retriesHeuristic[key]) {
            acc.retriesHeuristic[key] += stats.retriesHeuristic[key];
          } else {
            acc.retriesHeuristic[key] = stats.retriesHeuristic[key];
          }
        }
      );

      // Accumulate resetedSession
      acc.resetedSession += stats.resetedSession;

      // Accumulate browserStarts
      acc.browserStarts += stats.browserStarts;

      return acc;
    },
    {
      proxyTypes: {} as { [key in ProxyType]: number },
      visitedPages: [],
      errorTypeCount: {},
      estimatedProducts: 0,
      statusHeuristic: {
        "error-handled": 0,
        "page-completed": 0,
        "not-found": 0,
        "limit-reached": 0,
        total: 0,
      },
      retriesHeuristic: {
        "0": 0,
        "1-9": 0,
        "10-49": 0,
        "50-99": 0,
        "100-499": 0,
        "500+": 0,
      },
      resetedSession: 0,
      browserStarts: 0,
    } as QueueStats
  );
