import { AxiosError } from "axios";
import { getRedirectUrl } from "../services/head";
import { DbProductRecord } from "@dipmaxtech/clr-pkg";
import { MatchProductsStats } from "../types/taskStats/MatchProductsStats";

export const handleRelocateLinks = async (
  procProd: DbProductRecord,
  infos: MatchProductsStats
) => {
  try {
    if (
      procProd.a_lnk &&
      procProd.a_lnk.includes("idealo.de/relocator/relocate")
    ) {
      const redirectUrl = await getRedirectUrl(procProd.a_lnk);
      procProd.a_lnk = redirectUrl;
    }
    if (
      procProd.e_lnk &&
      procProd.e_lnk.includes("idealo.de/relocator/relocate")
    ) {
      const redirectUrl = await getRedirectUrl(procProd.e_lnk);
      procProd.e_lnk = redirectUrl;
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 404) {
        infos.notFound++;
      }
    }
  }
};

export const handleRelocateLinksInCrawlTask = async (
  product: DbProductRecord,
  infos: MatchProductsStats
) => {
  const { lnk } = product;

  if (!lnk.includes("idealo.de/relocator/relocate")) return;

  try {
    const redirectUrl = await getRedirectUrl(lnk);
    product.lnk = redirectUrl;

    const url = new URL(redirectUrl);

    return url.hostname;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 404) {
        infos.notFound++;
      }
    }
    return null;
  }
};
