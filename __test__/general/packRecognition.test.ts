import { detectQuantity } from "@dipmaxtech/clr-pkg";
//@ts-ignore
import { describe, expect, test } from "@jest/globals";
//@ts-ignore
import { packs } from "../static/packRecognition/packs.js";
//@ts-ignore
import { bunches } from "../static/packRecognition/bunch.js";
//@ts-ignore
import { packung } from "../static/packRecognition/packung.js";
//@ts-ignore
import { none } from "../static/packRecognition/none.js";

let cnt = 0;
/*
src: OL 98594 - Steckdosensicherung weiß, 5 Stück

trg: Babyruf KS 6 Steckdosensicherung, steckbar, 5 Stück, weiß, 98594

pack:
  - parse Number

 Hierarchy:
 - pack 
 - packung
 - bunch

*/
describe("Parse Packete", () => {
  packs.forEach((example: any, i: number) => {
    cnt++;
    test(`${cnt} Packs - ${example.input}`, () => {
      const packageSize = detectQuantity(example.input);
      expect(packageSize).toBe(example.package);
    });
  });

  packung.forEach((example: any) => {
    cnt++;
    test(`${cnt} Packung- ${example.input}`, () => {
      const packageSize = detectQuantity(example.input);
      expect(packageSize).toBe(example.package);
    });
  });

  bunches.forEach((example: any) => {
    cnt++;
    test(`${cnt} Bunches - ${example.input}`, () => {
      const packageSize = detectQuantity(example.input);
      expect(packageSize).toBe(example.package);
    });
  });

  none.forEach((example: any) => {
    cnt++;
    test(`${cnt} Nones - ${example.input}`, () => {
      const packageSize = detectQuantity(example.input);
      expect(packageSize).toBe(example.package);
    });
  });
});
