import { getRedirectUrl } from "../services/head.js";

export const handleRelocateLinks = async (procProd, infos) => {
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

export const handleRelocateLinksInCrawlTask = async (product, infos) => {
  const { link } = product;

  if (!link.includes("idealo.de/relocator/relocate")) return;

  try {
    const redirectUrl = await getRedirectUrl(link);
    product.link = redirectUrl;

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
