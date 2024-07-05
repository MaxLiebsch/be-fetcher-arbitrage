import {
  getDimensions,
  getPacks,
  getPackung,
  getSIUints,
} from "@dipmaxtech/clr-pkg";
//@ts-ignore
import { parseAsinFromUrl } from "../../src/util/parseAsin.js";
import { describe, expect, test, beforeAll } from "@jest/globals";

describe("Parse Packete", () => {
  // Packung mit 2
  // 3 Stück
  const examples = [
    "L'Oréal Paris Gesichtsreinigung, Erfrischendes Gesichtswasser zur Reinigung und Pflege, Für reife Haut, Age Perfect, 1 x 200 ml (Packung mit 2)",
    "HOLLE Bio-Folgemilch auf Ziegenmilchbasis 2 (400g)",
    "Holle - Bio-Fol­ge­milch 2 aus Zie­gen­milch - 0,4 kg - 6er Pack",
    "HOLLE Folgemilch auf Zie­gen­milch­ba­sis 2 (2 x 400g)",
    "Gold Feine Pastete 12x85g Forelle & Tomaten",
    "Gourmet PURINA GOURMET Gold Feine Pastete mit Gemüse Katzenfutter nass, mit Forelle und Tomaten, 12er Pack (12 x 85g)",
    "Gourmet Gold Lachs & Huhn Zigarette 12x85g Nass Katzenfutter",
    "Adult Huhn mit Lachs 2 kg 3 Packungen",
    "Applaws Katzentrockenfutter Adult, Huhn mit extra Lachs, getreidefrei und komplett 2kg (1 Packung)",
    "Applaws Katzentrockenfutter Adult, Huhn mit Lamm, getreidefrei und komplett 2 kg",
    "GOURMET Perle Erlesene Streifen 26x85g Thunfisch",
    "Gourmet Perle Erlesene Streifen Katzenfutter nass, mit Lachs, 26er Pack (26 x 85g)",
    "GOURMET Perle Erlesene Streifen 26x85g Thunfisch",
    "Max Factor Pastell Compact Powder 10 Pastell, 2er Pack (1 x 20 ml)",
    "tetesept Erkältungs Kapseln – Erkältungsmittel wirksam bei Husten, Schnupfen und akuter Bronchitis – 3-fach-wirkendes, pflanzliches Arzneimittel mit Thymian – 5 x 40 Stück",
    "L'Oréal Paris Permanente Haarfarbe, Haarfärbeset mit Coloration und Farbglanz-Pflegebalsam, Préférence, P11 Kühles Intensives Schwarz (Manhattan), 3er Set",
  ];

  test("test with parsePrice only", () => {
    examples.forEach((example) => {
      const res = getDimensions(example);
      const ro = getSIUints(example);
      const rs = getPacks(example);
      const pc = getPackung(example);
      console.log("dimension:", res, "units:", ro, "pack:", rs, "packung:", pc);
    });
  });
});
