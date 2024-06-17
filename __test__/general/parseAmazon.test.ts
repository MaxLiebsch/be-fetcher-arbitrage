//@ts-ignore
import { parseAsinFromUrl } from "../../src/util/parseAsin.js";
import { describe, expect, test, beforeAll } from "@jest/globals";

describe("Parse ASIn", () => {
  const examples = [
      {
        a_lnk:
          "https://www.amazon.de/sspa/click?ie=UTF8&spc=MTo4MjA3MjA1NDc1MTM4MzQwOjE3MTg2NTkwMjg6c3BfbXRmOjMwMDA2NzgwNDk0MzgzMjo6MDo6&url=%2FELITUN-Schreibtischlampe-Stufenlos-Klemmleuchte-Arbeitsplatzlampe%2Fdp%2FB0CF4K1QVL%2Fref%3Dsr_1_1_sspa%3Fkeywords%3D4067796017908%26qid%3D1718659028%26sr%3D8-1-spons%26sp_csd%3Dd2lkZ2V0TmFtZT1zcF9tdGY%26psc%3D1",
        asin: "B0CF4K1QVL",
      },
      {
        a_lnk:
          "https://www.amazon.de/dp/B06Y44SS12/?smid=A1AO6B9JD79F0S&tag=idealode-mp-pk-21&linkCode=asn&creative=6742&camp=1638&creativeASIN=B06Y44SS12&ascsubtag=2024-06-17_ba4b7dffbfa842790042422e7c42640d9200d2b9dada9936fdf087204bdd2386&th=1&psc=1",
        asin: "B06Y44SS12",
      },
      {
        a_lnk:
          "https://www.amazon.de/dp/B06XGJJN66/?smid=A2KWAB84YLD6PQ&tag=idealode-mp-pk-21&linkCode=asn&creative=6742&camp=1638&creativeASIN=B06XGJJN66&ascsubtag=2024-06-17_ba4b7dffbfa842790042422e7c42640d9200d2b9dada9936fdf087204bdd2386&th=1&psc=1",
        asin: "B06XGJJN66",
      },
      {
        a_lnk:
          "https://www.amazon.de/dp/B00GPUWNZO/?smid=A1BK3CQ65KQRIE&tag=idealode-mp-pk-21&linkCode=asn&creative=6742&camp=1638&creativeASIN=B00GPUWNZO&ascsubtag=2024-06-17_ba4b7dffbfa842790042422e7c42640d9200d2b9dada9936fdf087204bdd2386&th=1&psc=1",
        asin: "B00GPUWNZO",
      },
      {
        a_lnk:
          "https://www.amazon.de/Transparent-Natural-Transparentes-Pastell-Compact/dp/B0B92B1XJ7/ref=sr_1_2?dib=eyJ2IjoiMSJ9.2uKfT87EPjrGlw9b5cZw11NCdqaRDNvZIAG1Jf5anAc.gNaTxDEO4F7pALNWpSd8nY9QePKSA_Q2526hS-PWn60&dib_tag=se&keywords=4069700061311&qid=1718660006&sr=8-2",
        asin: "B0B92B1XJ7",
      },
      {
        a_lnk:
          "https://www.amazon.de/Manhattan-16918-Compact-Powder-naturelle/dp/B00127KDFC/ref=sr_1_1?dib=eyJ2IjoiMSJ9.kZoxBvATJNhqADkI5z8tOg.qX_fwv8jOiDIqvJSluuzxFEuQCh16lkesZN49JHQpFM&dib_tag=se&keywords=4002554169185&qid=1718660010&sr=8-1",
        asin: "B00127KDFC",
      },

      {
        a_lnk:
          "https://www.amazon.de/LOr%C3%A9al-Paris-Perfect-Match-Vanille/dp/B07RQV93QY/ref=sr_1_1?dib=eyJ2IjoiMSJ9.GfWN75mk0nPQU8tm9fHTZDwnh56g8qRGCKxj7CLyg-TGjHj071QN20LucGBJIEps.MqjMFHs4O8As6qFWLmfcFZJOzO5u2y6WrKS_9kMEEoQ&dib_tag=se&keywords=3600523708901&qid=1718660022&rdc=1&sr=8-1",
        asin: "B07RQV93QY",
      },
      {
        a_lnk:
          "https://www.amazon.de/dp/B06XGM135P/?smid=A2KDP9D53AT0WX&tag=idealode-mp-pk-21&linkCode=asn&creative=6742&camp=1638&creativeASIN=B06XGM135P&ascsubtag=2024-06-17_ba4b7dffbfa842790042422e7c42640d9200d2b9dada9936fdf087204bdd2386&th=1&psc=1",
        asin: "B06XGM135P",
      },
      {
        a_lnk:
          "https://www.amazon.de/dp/B09LRBN1QW/?smid=A2NSXUMBQKZERF&tag=idealode-mp-pk-21&linkCode=asn&creative=6742&camp=1638&creativeASIN=B09LRBN1QW&ascsubtag=2024-06-17_ba4b7dffbfa842790042422e7c42640d9200d2b9dada9936fdf087204bdd2386&th=1&psc=1",
        asin: "B09LRBN1QW",
      },

      {
        a_lnk:
          "https://www.amazon.de/Transparent-Transparentes-praktischer-Puderquaste-cleverem/dp/B0CH3M32BZ/ref=sr_1_2?dib=eyJ2IjoiMSJ9.NUD9uf9KLWlK3nW76OMQrJGv__C-tUB20spVz44IDhLGjHj071QN20LucGBJIEps.Gb2qV3ZuJlp6HNoXNZwYn-7Qh8NCeMh_WI_E8LSrK5o&dib_tag=se&keywords=4069700061335&qid=1718660037&sr=8-2",
        asin: "B0CH3M32BZ",
      },
      {
        a_lnk:
          "https://www.amazon.de/Manhattan-16888-Compact-Powder-vanille/dp/B00127KDFM/ref=sr_1_1?dib=eyJ2IjoiMSJ9.aGt8bbAlLprjWPs2ceFX-w.-4uhvjZGsXOrO-00cwRhVwXk7jdvNfdDkmx_3L62vZw&dib_tag=se&keywords=4002554168881&qid=1718660042&sr=8-1",
        asin: "B00127KDFM",
      },
    ]
  

  test("test with parsePrice only", () => {
    examples.forEach((example) => {
      const parsedPrice = parseAsinFromUrl(example.a_lnk);
      expect(parsedPrice).toBe(example.asin);
    });
  });
});
