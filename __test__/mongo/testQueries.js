import { getArbispotterDb } from "../../src/service/db/mongo.js";

const testQueries = async () => {
  const domain = "idealo.de";
  const aggregation = [
    {
      $addFields: {
        primaryBsr: {
          $cond: {
            if: {
              $size: "$bsr",
            },
            then: {
              $arrayElemAt: ["$bsr", 0],
            },
            else: null,
          },
        },
        secondaryBsr: {
          $cond: {
            if: {
              $size: "$bsr",
            },
            then: {
              $arrayElemAt: ["$bsr", 1],
            },
            else: null,
          },
        },
        thirdBsr: {
          $cond: {
            if: {
              $size: "$bsr",
            },
            then: {
              $arrayElemAt: ["$bsr", 2],
            },
            else: null,
          },
        },
      },
    },
    {
      $match: {
        $and: [
          {
            a_prc: {
              $gt: 0,
            },
          },
          {
            a_mrgn_pct: {
              $gt: 20,
              $lte: 150,
            },
          },
          {
            a_mrgn: {
              $gt: 25,
            },
          },
          {
            $or: [
              {
                primaryBsr: {
                  $eq: null,
                },
              },
              {
                "primaryBsr.number": {
                  $lte: 20000,
                },
              },
            ],
          },
          {
            $or: [
              {
                primaryBsr: {
                  $eq: null,
                },
              },
              {
                "secondaryBsr.number": {
                  $lte: 20000,
                },
              },
            ],
          },
        ],
      },
    },
    {
      $addFields: {
        primaryBsrExists: {
          $cond: {
            if: { $ifNull: ["$primaryBsr", false] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        a_prc: 1,
        a_mrgn: 1,
        a_mrgn_pct: 1,
        bsr: 1,
        primaryBsr: 1,
        secondaryBsr: 1,
        thirdBsr: 1,
        primaryBsrExists: 1,
      },
    },
    {
      $sort: {
        primaryBsrExists: -1,
        "primaryBsr.number": 1,
        "secondaryBsr.number": 1,
        "thirdBsr.number": 1,
        a_mrgn_pct: -1,
      },
    },
  ];

  const db = await getArbispotterDb();

  const res = await db.collection(domain).aggregate(aggregation).toArray();

  let primaryBsrHeuristic = {};
  console.log("Nlength:", res.length);
  console.log(
    res.map((r) => {
      primaryBsrHeuristic[r.primaryBsr?.number ? "object" : null] =
        primaryBsrHeuristic[typeof r.primaryBsr]
          ? primaryBsrHeuristic[typeof r.primaryBsr] + 1
          : 1;
      return r.primaryBsr;
    })
      ? "❤️ all products have primaryBsr"
      : "👻 all products have primaryBsr"
  );

  console.log("Start: ", res.slice(0, 1)[0]);
  console.log("End: ", res.slice(-1)[0]);

  console.log("primaryBsrHeuristic:", primaryBsrHeuristic);
  console.log(
    res.some((r) => r.bsr.length === 0)
      ? "❤️ products without bsr"
      : "👻 products without bsr"
  );

  console.log(
    res.every((r) => r.primaryBsrExists)
      ? "❤️ all products have primaryBsrExists"
      : "👻 all products have primaryBsrExists"
  );

  console.log(
    res[0].bsr.length ? "❤️ firstproduct has bsr" : "👻 firstproduct has bsr"
  );
  console.log(
    res.some((r) => r.primaryBsrExists === false)
      ? "❤️ primaryBsrExists"
      : "👻 primaryBsrExists"
  );
  console.log(
    res.some((r) => !r.primaryBsrExists)
      ? "❤️ !primaryBsrExists"
      : "👻 !primaryBsrExists"
  );
};

testQueries().then((r) => {
  process.exit(0);
});
