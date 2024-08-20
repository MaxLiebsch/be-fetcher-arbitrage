export const resetEbyProductQuery = ({ eby_prop, cat_prop }) => {
  const query = {
    $unset: {
      //standard properties
      e_pblsh: "",
      e_nm: "",
      e_lnk: "",
      e_img: "",
      esin: "",
      e_prc: "",
      e_uprc: "",
      e_qty: "",
      e_orgn: "",
      e_hash: "",
      e_mrgn: "",
      e_mrgn_pct: "",
      e_ns_costs: "",
      e_ns_mrgn: "",
      e_ns_mrgn_pct: "",
      e_tax: "",
      ebyCategories: "",
      e_vrfd: "",
      // lookup category
      cat_taskId: "",
      // scrape listing
      ebyUpdatedAt: "",
      eby_taskId: "",
      // dealeby properties
      dealEbyUpdatedAt: "",
      dealEby_taskId: "",
    },
  };

  if (!query["$set"] && (eby_prop || cat_prop)) {
    query["$set"] = {};
  }
  if (eby_prop) {
    query["$set"]["eby_prop"] = eby_prop;
  } else {
    query["$unset"]["eby_prop"] = "";
  }

  if (cat_prop) {
    query["$set"]["cat_prop"] = cat_prop;
  } else {
    query["$unset"]["cat_prop"] = "";
  }

  return query;
};
