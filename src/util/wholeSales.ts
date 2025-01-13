import { hostname } from "../db/mongo.js";

export const wholeSaleNotFoundQuery = {
  $set: {
    e_status: "not found",
    e_lookup_pending: false,
    e_locked: false,
  },
  $pull: { clrName: hostname },
};
