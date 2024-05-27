export const MATCH_TIME_LIMIT = 480;
export const CONCURRENCY = 4;
export const DEFAULT_CHECK_PROGRESS_INTERVAL = 20000;
export const COOLDOWN = 30 * 60 * 1000;
export const COOLDOWN_LONG = 60 * 60 * 1000;
export const COOLDOWN_MULTIPLIER = 3; // 3 hours from now
export const PRODUCT_LIMIT = 10000;
export const DANGLING_LOOKUP_THRESHOLD = 20;
export const MATCH_LOOKUP_THRESHOLD = 0.8;
export const CRAWL_THRESHOLD = 0.9;
export const MAX_TASK_RETRIES = 6;
export const DEFAULT_MAX_TASK_RETRIES = 3;
export const MAX_EARNING_MARGIN = 150;
export const NEW_TASK_CHECK_INTERVAL = 10000;

export const proxyAuth = {
  host: "127.0.0.1:8080",
  username: "",
  password: "",
};

export const activeShops = [
  "alternate.de",
  "reichelt.de",
  "mueller.de",
  "bergfreunde.de",
  "voelkner.de",
  "idealo.de",
];
