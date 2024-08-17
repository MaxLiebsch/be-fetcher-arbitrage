import { keepaProperties } from "./createOrUpdateArbispotterProduct";

export const resetAznProductQuery = () => {
  const query = {
    $unset: {
      //standard properties
      a_pblsh: "",
      a_nm: "",
      a_lnk: "",
      a_img: "",
      asin: "",
      a_prc: "",
      bsr: "",
      costs: "",
      a_uprc: "",
      a_qty: "",
      a_orgn: "",
      a_hash: "",
      a_mrgn: "",
      a_mrgn_pct: "",
      a_w_mrgn: "",
      a_w_mrgn_pct: "",
      a_p_w_mrgn: "",
      a_p_w_mrgn_pct: "",
      a_p_mrgn: "",
      a_vrfd: '',
      a_p_mrgn_pct: "",
      // lockup info
      info_prop: "",
      // keepa properties
      keepaUpdatedAt: "",
      keepa_lckd: "",
      // scrape listing
      aznUpdatedAt: "",
      azn_taskId: "",
      // dealazn properties
      dealAznUpdatedAt: "",
      dealAzn_taskId: "",
    },
  };
  keepaProperties.forEach((prop) => {
    query.$unset[prop.name] = "";
  });
  return query;
};
