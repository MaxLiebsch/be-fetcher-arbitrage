import { describe, expect, test, beforeAll } from "@jest/globals";
//@ts-ignore
import { resetAznProductQuery } from "../../src/services/db/util/aznQueries.js";
import { UTCDate } from "@date-fns/utc";

describe("aznQuery", () => {
  test("aznQuery", () => {
    const reset = resetAznProductQuery({ info_prop: "missing" });
    
    if (reset?.$set) {
        reset.$set["updatedAt"] = new UTCDate().toISOString();
    } else {
        reset["$set"] = { updatedAt: new UTCDate().toISOString() };
    }
    console.log("reset:", reset);
    
    expect(reset.$unset.info_prop).toBeUndefined();
    expect(reset.$set.info_prop).toBe("missing");
  });
});
