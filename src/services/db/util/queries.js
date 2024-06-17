export const pendingEanLookupProductsQuery = {
  $and: [
    {
      $or: [{ ean_locked: { $exists: false } }, { ean_locked: { $eq: false } }],
    },
    {
      $or: [{ ean: { $exists: false } }, { ean: { $exists: true, $eq: "" } }],
    },
  ],
};
