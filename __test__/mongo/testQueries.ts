import { getProductsCol } from '../../src/db/mongo.js';

import _ from 'underscore';
import { reduceCount } from '../../src/db/util/updateStats.js';
import { forEach } from 'underscore';
import { ObjectId } from '@dipmaxtech/clr-pkg';

const testQueries = async () => {
  const col = await getProductsCol();
  const last24h = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();

  const ids = [
    {
      $oid: '6705e30c851e9f774e3b6419',
    },
    {
      $oid: '6709d96f799ff85d43641b00',
    },
    {
      $oid: '670960bc60406a0195fbf6f5',
    },
    {
      $oid: '670db6aec63b02233946499e',
    },
    {
      $oid: '6705e5ac851e9f774e3b73e0',
    },
    {
      $oid: '670960c460406a0195fbf6f7',
    },
    {
      $oid: '670db6aec63b02233946499d',
    },
    {
      $oid: '670db6aec63b02233946499b',
    },
    {
      $oid: '670db6aec63b02233946499c',
    },
    {
      $oid: '670960c460406a0195fbf6f8',
    },
    {
      $oid: '67039f6d868374ca232d8545',
    },
    {
      $oid: '670db6aec63b0223394649a0',
    },
    {
      $oid: '6715a875f14c00dc3dcb2454',
    },
    {
      $oid: '670db6aec63b02233946499f',
    },
    {
      $oid: '670079d3f7821cb7283c7b6a',
    },
    {
      $oid: '67007829f7821cb7283c6b8a',
    },
    {
      $oid: '670964d89d850996ed9e4fb6',
    },
    {
      $oid: '6705e49b851e9f774e3b694a',
    },
    {
      $oid: '670079d6f7821cb7283c7b96',
    },
    {
      $oid: '670079cdf7821cb7283c7b1a',
    },
    {
      $oid: '6703a11e868374ca232d95e2',
    },
    {
      $oid: '67007848f7821cb7283c6c3b',
    },
    {
      $oid: '6715a9f1117899b93a60b67b',
    },
    {
      $oid: '67007829f7821cb7283c6b90',
    },
    {
      $oid: '6705e49b851e9f774e3b6959',
    },
    {
      $oid: '67007829f7821cb7283c6b8d',
    },
    {
      $oid: '6715a9f0117899b93a60b669',
    },
    {
      $oid: '67007829f7821cb7283c6b8e',
    },
    {
      $oid: '67007853f7821cb7283c6c88',
    },
    {
      $oid: '67007853f7821cb7283c6c96',
    },
    {
      $oid: '67007950f7821cb7283c7610',
    },
    {
      $oid: '67202d7ff02b807541ca9ccd',
    },
    {
      $oid: '6705e64e851e9f774e3b7a88',
    },
    {
      $oid: '6705e658851e9f774e3b7adf',
    },
    {
      $oid: '6705e652851e9f774e3b7a9e',
    },
    {
      $oid: '670964d89d850996ed9e4fba',
    },
    {
      $oid: '67007853f7821cb7283c6c8c',
    },
    {
      $oid: '670964da9d850996ed9e4fd1',
    },
    {
      $oid: '670964da9d850996ed9e4fce',
    },
    {
      $oid: '670964d99d850996ed9e4fc1',
    },
    {
      $oid: '67039f4f868374ca232d84ab',
    },
    {
      $oid: '670964da9d850996ed9e4fcd',
    },
    {
      $oid: '670964dc9d850996ed9e4fd6',
    },
    {
      $oid: '670964da9d850996ed9e4fd0',
    },
    {
      $oid: '670964d99d850996ed9e4fc0',
    },
    {
      $oid: '67039f4f868374ca232d84ac',
    },
    {
      $oid: '67039f4f868374ca232d84b8',
    },
    {
      $oid: '67039f4f868374ca232d84b1',
    },
    {
      $oid: '6715a871f14c00dc3dcb2452',
    },
    {
      $oid: '67039f4f868374ca232d84ae',
    },
    {
      $oid: '67039f95868374ca232d8603',
    },
    {
      $oid: '67039f4f868374ca232d84b2',
    },
    {
      $oid: '6703a23e868374ca232da332',
    },
    {
      $oid: '66fd7227a1220609c22ae556',
    },
    {
      $oid: '6703a276868374ca232da57e',
    },
    {
      $oid: '67039f4f868374ca232d84b7',
    },
    {
      $oid: '67039f95868374ca232d85fc',
    },
    {
      $oid: '67039f95868374ca232d85fe',
    },
    {
      $oid: '67039f95868374ca232d85fb',
    },
    {
      $oid: '67039f95868374ca232d85f8',
    },
    {
      $oid: '67039f95868374ca232d85ff',
    },
    {
      $oid: '67048c83ac18dd2ee08064fd',
    },
    {
      $oid: '67048c9fac18dd2ee0806611',
    },
    {
      $oid: '67048c30ac18dd2ee080626f',
    },
    {
      $oid: '67048c79ac18dd2ee08064bf',
    },
    {
      $oid: '67048c8eac18dd2ee080656d',
    },
    {
      $oid: '67048c8eac18dd2ee0806576',
    },
    {
      $oid: '67048c8aac18dd2ee080653a',
    },
    {
      $oid: '67048c8aac18dd2ee0806537',
    },
    {
      $oid: '67048c93ac18dd2ee0806594',
    },
    {
      $oid: '67048c8dac18dd2ee0806561',
    },
    {
      $oid: '67048c93ac18dd2ee0806597',
    },
    {
      $oid: '67048c8dac18dd2ee0806563',
    },
    {
      $oid: '67048c99ac18dd2ee08065ca',
    },
    {
      $oid: '6707413f97e3429d093d1dd1',
    },
    {
      $oid: '6707414b97e3429d093d1e64',
    },
    {
      $oid: '6707413597e3429d093d1d7c',
    },
    {
      $oid: '6705e451851e9f774e3b6861',
    },
    {
      $oid: '6707414b97e3429d093d1e88',
    },
    {
      $oid: '6705e451851e9f774e3b6871',
    },
    {
      $oid: '6705e451851e9f774e3b6867',
    },
    {
      $oid: '6705e451851e9f774e3b6870',
    },
    {
      $oid: '67048c91ac18dd2ee0806580',
    },
    {
      $oid: '67048c8dac18dd2ee0806568',
    },
    {
      $oid: '670078bff7821cb7283c7054',
    },
    {
      $oid: '6705e22cb7a178fbd1846651',
    },
    {
      $oid: '67073ec297e3429d093d0735',
    },
    {
      $oid: '6707400c97e3429d093d1134',
    },
    {
      $oid: '6707400497e3429d093d10f0',
    },
    {
      $oid: '67073ec197e3429d093d0726',
    },
    {
      $oid: '67073ec297e3429d093d074f',
    },
    {
      $oid: '67073fe497e3429d093d0f6a',
    },
    {
      $oid: '67073fbd97e3429d093d0dc0',
    },
    {
      $oid: '67073fe897e3429d093d0f8b',
    },
    {
      $oid: '67073fbd97e3429d093d0dbc',
    },
    {
      $oid: '67073f8797e3429d093d0b5d',
    },
    {
      $oid: '67073e9097e3429d093d0663',
    },
    {
      $oid: '67073ec297e3429d093d074d',
    },
    {
      $oid: '67073fcb97e3429d093d0e54',
    },
    {
      $oid: '6707401397e3429d093d11a2',
    },
    {
      $oid: '67073e9797e3429d093d067c',
    },
    {
      $oid: '67073f9d97e3429d093d0c56',
    },
    {
      $oid: '67073e9797e3429d093d0679',
    },
    {
      $oid: '67073e9797e3429d093d0689',
    },
    {
      $oid: '6707400497e3429d093d10ee',
    },
    {
      $oid: '6707446897e3429d093d3452',
    },
    {
      $oid: '6707445e97e3429d093d33d9',
    },
    {
      $oid: '6707445797e3429d093d33b9',
    },
    {
      $oid: '6707446497e3429d093d3419',
    },
    {
      $oid: '6707446097e3429d093d3405',
    },
    {
      $oid: '6707446c97e3429d093d3470',
    },
    {
      $oid: '6707445e97e3429d093d33e2',
    },
    {
      $oid: '6707446497e3429d093d342d',
    },
    {
      $oid: '6707446797e3429d093d343d',
    },
    {
      $oid: '67039f51868374ca232d84c4',
    },
    {
      $oid: '6703a169868374ca232d995e',
    },
    {
      $oid: '6707445497e3429d093d338d',
    },
    {
      $oid: '66fd722fa1220609c22ae560',
    },
    {
      $oid: '6703a169868374ca232d9977',
    },
    {
      $oid: '6707446497e3429d093d3420',
    },
    {
      $oid: '66fd7230a1220609c22ae577',
    },
    {
      $oid: '6707445e97e3429d093d33e0',
    },
    {
      $oid: '6707445f97e3429d093d33f5',
    },
    {
      $oid: '66fd7230a1220609c22ae576',
    },
    {
      $oid: '6707445c97e3429d093d33d0',
    },
    {
      $oid: '6707446497e3429d093d3428',
    },
    {
      $oid: '6707446097e3429d093d3414',
    },
    {
      $oid: '6707445e97e3429d093d33d8',
    },
    {
      $oid: '6707445e97e3429d093d33dd',
    },
  ];

  for (const id of ids) {
    console.log('id.$oid:', id.$oid)
    const result = await col.findOne({ _id: new ObjectId(id.$oid) });
    if(!result?.eanList){
      throw new Error(`Product with id ${id.$oid} does not have eanList`);
    }
  }
};

testQueries().then((r) => {
  process.exit(0);
});
