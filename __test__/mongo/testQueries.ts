import { getProductsCol } from "../../src/db/mongo.js";


const testQueries = async () => {
  const col = await getProductsCol();

  const res = await col.aggregate([
    {
      $match: {
        sdmn: ["idealo.de", "reichelt.de", "saturn.de"],
        a_prc: { $gt: 0 },
        costs: { $exists: true },
        $or: [
          { avg30_ahsprcs: { $exists: true, $gt: 0 } },
          { avg30_ansprcs: { $exists: true, $gt: 0 } },
          { avg90_ahsprcs: { $exists: true, $gt: 0 } },
          { avg90_ansprcs: { $exists: true, $gt: 0 } },
        ],
      },
    },
    {
      $addFields: {
        [`a_mrgn`]: {
          $round: [
            {
              $subtract: [
                {
                  $ifNull: [
                    "avg30_ahsprcs",
                    {
                      $ifNull: [
                        "avg30_ansprcs",
                        {
                          $ifNull: ["avg90_ahsprcs", "avg90_ansprcs"],
                        },
                      ],
                    },
                  ],
                },
                {
                  $add: [
                    {
                      $divide: [
                        {
                          $multiply: [
                            "$a_prc",
                            { $divide: ["$a_qty", "$qty"] },
                          ],
                        },
                        {
                          $add: [
                            1,
                            { $divide: [{ $ifNull: ["$tax", 19] }, 100] },
                          ],
                        },
                      ],
                    },
                    {
                      $subtract: [
                        "$a_prc",
                        {
                          $divide: [
                            "$a_prc",
                            {
                              $add: [
                                1,
                                { $divide: [{ $ifNull: ["$tax", 19] }, 100] },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    "$costs.tpt",
                    "$costs.varc",
                    "$costs.strg_2_hy",
                    "$costs.azn",
                  ],
                },
              ],
            },
            2,
          ],
        },
      },
    },
    {
      $addFields: {
        [`a_mrgn_pct`]: {
          $round: [
            {
              $multiply: [
                {
                  $divide: ["$a_mrgn", "$a_prc"],
                },
                100,
              ],
            },
            2,
          ],
        },
      },
    },
    {
      $match: {
        a_mrgn: { $gt: 0 },
        a_mrgn_pct: { $gt: 0 },
      },
    },
    {
      $limit: 20,
    },
  ]);
  console.log(res.toArray())
};

testQueries().then((r) => {
  process.exit(0);
});
