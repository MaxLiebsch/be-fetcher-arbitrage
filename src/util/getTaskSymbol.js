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
    case "CRAWL_EBY_LISTINGS":
      return "🔍";
    case "QUERY_EANS_EBY":
      return "🔍";
    case "LOOKUP_CATEGORY":
      return "🔍";
    case "LOOKUP_INFO":
      return "🔍";
    case "CRAWL_EAN":
      return "🆕";
    default:
      return "🤷‍♂️";
  }
};
