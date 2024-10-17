import { describe, expect, test, beforeAll } from "@jest/globals";
import {resetAznProductQuery} from "@dipmaxtech/clr-pkg";

describe("aznQuery", () => {
  test("aznQuery", () => {
    const reset = resetAznProductQuery({ info_prop: "missing" });
    
    if (reset?.$set) {
        reset.$set["updatedAt"] = new Date().toISOString();
    } else {
        reset["$set"] = { updatedAt: new Date().toISOString() };
    }
    console.log("reset:", reset);
    
    expect(reset.$unset.info_prop).toBeUndefined();
    expect(reset.$set.info_prop).toBe("missing");
  });
});
