
export const getTaskSymbol = (type) => {
  switch (type) {
    case "CRAWL_SHOP":
      return "🕷️";
    case "WHOLESALE_SEARCH":
      return "🔍";
    case "SCAN_SHOP":
      return "🔎";
    case "MATCH_PRODUCTS":
      return "🧩";
    case "CRAWL_AZN_LISTINGS":
      return "🔍";
    case "LOOKUP_INFO":
      return "🔍";
    case "CRAWL_EAN":
      return "🆕";
    default:
      return "🤷‍♂️";
  }
};