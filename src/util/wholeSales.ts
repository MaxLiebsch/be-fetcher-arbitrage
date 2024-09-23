import { hostname } from "../db/mongo.js";

export const wholeSaleNotFoundQuery = {
  $set: {
    e_status: "not found",
    e_lookup_pending: false,
  },
  $unset: {
    e_locked: "",
  },
  $pull: { clrName: hostname },
};
