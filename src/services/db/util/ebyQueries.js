
export const resetEbyProductQuery = () => {
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
      ebyCategories: '',
      e_vrfd: "",
      // query ean on eby
      eby_prop: "",
      // lookup category
      cat_prop: "",
      cat_taskId: '',
      // scrape listing
      ebyUpdatedAt: "",
      eby_taskId: "",
      // dealeby properties
      dealEbyUpdatedAt: "",
      dealEby_taskId: "",
    },
  }
  return query;
};
