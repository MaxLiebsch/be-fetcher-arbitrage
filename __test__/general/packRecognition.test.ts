import { getDimensions, getPacks, getSIUints } from "@dipmaxtech/clr-pkg";
//@ts-ignore
import { parseAsinFromUrl } from "../../src/util/parseAsin.js";
import { describe, expect, test, beforeAll } from "@jest/globals";

describe("Parse Packete", () => {
  const examples = [
     {
       nm: "HOLLE Bio-Folgemilch auf Ziegenmilchbasis 2 (400g)",
       a_nm: "Holle - Bio-Fol­ge­milch 2 aus Zie­gen­milch - 0,4 kg - 6er Pack",
       e_nm: "HOLLE Folgemilch auf Zie­gen­milch­ba­sis 2 (2 x 400g)",
     }, 
     {
      nm: "Gold Feine Pastete 12x85g Forelle & Tomaten",
      a_nm: "Gourmet PURINA GOURMET Gold Feine Pastete mit Gemüse Katzenfutter nass, mit Forelle und Tomaten, 12er Pack (12 x 85g)",
      e_nm: 'Gourmet Gold Lachs & Huhn Zigarette 12x85g Nass Katzenfutter'
     },
     {
      nm: 'Adult Huhn mit Lachs 2 kg 3 Packungen',
      a_nm: "Applaws Katzentrockenfutter Adult, Huhn mit extra Lachs, getreidefrei und komplett 2kg (1 Packung)",
      e_nm: "Applaws Katzentrockenfutter Adult, Huhn mit Lamm, getreidefrei und komplett 2 kg"
     },
     {
      nm: "GOURMET Perle Erlesene Streifen 26x85g Thunfisch",
      a_nm: "Gourmet Perle Erlesene Streifen Katzenfutter nass, mit Lachs, 26er Pack (26 x 85g)",
      e_nm: "GOURMET Perle Erlesene Streifen 26x85g Thunfisch"
     }
    ]
  

  test("test with parsePrice only", () => {
    examples.forEach((example) => {
      
      const res = getDimensions(example.nm)
      const ro = getSIUints(example.nm)
      const rs = getPacks(example.nm);
      console.log('dimension:', res)
      console.log('units:', ro)
      console.log('pack:', rs)
      const re = getDimensions(example.a_nm)
      const ra = getSIUints(example.a_nm)
      const rb = getPacks(example.a_nm);

      console.log('dimension:', rb)
      console.log('units:', ra)
      console.log('pack:', re)
      const r = getDimensions(example.e_nm)
      const r1 = getSIUints(example.e_nm)
      const r2 = getPacks(example.e_nm);
      console.log('dimension:', r2)
      console.log('units:', r1)
      console.log('pack:', r)
    });
  });
});
