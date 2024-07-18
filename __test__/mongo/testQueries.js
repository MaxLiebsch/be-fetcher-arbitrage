import { getArbispotterDb } from "../../src/services/db/mongo.js";

const testQueries = async () => {
  const domain = "idealo.de";
  const tpt = 4.95;
  const strg = 3;
  const tax = 0.19;
  const aggregation = [
    {
      $match: {
        e_pblsh: true,
        e_prc: { $gt: 0 },
        e_uprc: { $gt: 0 },
      },
    },
    {
      $addFields: {
        e_mrgn: {
          $round: [
            {
              $subtract: [
                "$e_prc",
                {
                  $add: [
                    {
                      $divide: [
                        "$uprc",
                        {
                          $add: [
                            1,
                            { $divide: [{ $ifNull: ["$tax", 19] }, 100] },
                          ],
                        },
                      ],
                    },
                    "$e_tax",
                    tpt,
                    strg,
                    "$e_costs",
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
        e_mrgn_pct: {
          $round: [
            {
              $multiply: [
                {
                  $divide: ["$e_mrgn", "$e_uprc"],
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
        $and: [
          {
            $and: [
              { e_prc: { $gt: 0 } },
              { e_mrgn: { $gt: 0 } },
              { e_mrgn_pct: { $gt: 14, $lte: 150 } },
            ],
          },
          {
            $or: [
              {
                $and: [
                  { "e_vrfd.vrfd": true },
                  { "e_vrfd.vrfn_pending": false },
                ],
              },
              {
                $and: [
                  { "e_vrfd.vrfd": false },
                  { "e_vrfd.vrfn_pending": true },
                ],
              },
              { "e_vrfd.flag_cnt": { $lt: { $size: 3 } } },
            ],
          },
        ],
      },
    },
    {
      $count: "productCount",
    },
  ];

  const aggregation2 = [
    { $match: { e_pblsh: true, e_prc: { $gt: 0 }, e_uprc: { $gt: 0 } } },
    {
      $addFields: {
        e_mrgn: {
          $round: [
            {
              $subtract: [
                "$e_prc",
                {
                  $add: [
                    {
                      $divide: [
                        "$uprc",
                        { $add: [1, { $divide: [{ $ifNull: ["$tax", 19] }, 100] }] },
                      ],
                    },
                    "$e_tax",
                    4.95,
                    3,
                    "$e_costs",
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
        e_mrgn_pct: {
          $round: [
            { $multiply: [{ $divide: ["$e_mrgn", "$e_uprc"] }, 100] },
            2,
          ],
        },
      },
    },
    {
      $match: {
        e_pblsh: true,
        $and: [
          {
            $and: [
              { e_prc: { $gt: 0 } },
              { e_mrgn: { $gt: 0 } },
              { e_mrgn_pct: { $gt: 14, $lte: 150 } },
            ],
          },
          {
            $or: [
              {
                $and: [
                  { "e_vrfd.vrfd": true },
                  { "e_vrfd.vrfn_pending": false },
                ],
              },
              {
                $and: [
                  { "e_vrfd.vrfd": false },
                  { "e_vrfd.vrfn_pending": true },
                ],
              },
              { "e_vrfd.flag_cnt": { $lt: { $size: 3 } } },
            ],
          },
        ],
      },
    },
    { $count: "productCount" },
  ];

  const db = await getArbispotterDb();

  console.log("aggregation:", aggregation);
  console.log("aggregation2:", aggregation2);
  const res = await db.collection(domain).aggregate(aggregation).toArray();
  const res2 = await db.collection(domain).aggregate(aggregation2).toArray();
  console.log("aggregation1:", res);
  console.log("aggregation2:", res2);
};

testQueries().then((r) => {
  process.exit(0);
});
