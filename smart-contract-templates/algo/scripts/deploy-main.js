/**
 * Description:
 * This file deploys the stateful smart contract to create and transfer NFT
 */
const { types } = require('@algo-builder/web');
const { convert } = require('@algo-builder/algob');
const { executeTransaction } = require('./transfer/common');

async function run(runtimeEnv, deployer) {
  const masterAccount = deployer.accountsByName.get('master-account');
  const john = deployer.accountsByName.get('john');
  const elon = deployer.accountsByName.get('elon');
  const alice = deployer.accountsByName.get('alice');
  const bob = deployer.accountsByName.get('bob');

  const algoTxnGroup = [
    {
      type: types.TransactionType.TransferAlgo,
      sign: types.SignType.SecretKey,
      fromAccount: masterAccount,
      toAccountAddr: john.addr,
      amountMicroAlgos: 401000000, // 401 algos
      payFlags: { note: 'funding account' },
    },
    {
      type: types.TransactionType.TransferAlgo,
      sign: types.SignType.SecretKey,
      fromAccount: masterAccount,
      toAccountAddr: elon.addr,
      amountMicroAlgos: 401000000, // 401 algos
      payFlags: { note: 'funding account' },
    },
    {
      type: types.TransactionType.TransferAlgo,
      sign: types.SignType.SecretKey,
      fromAccount: masterAccount,
      toAccountAddr: alice.addr,
      amountMicroAlgos: 401000000, // 401 algos
      payFlags: { note: 'funding account' },
    },
    {
      type: types.TransactionType.TransferAlgo,
      sign: types.SignType.SecretKey,
      fromAccount: masterAccount,
      toAccountAddr: bob.addr,
      amountMicroAlgos: 401000000, // 401 algos
      payFlags: { note: 'funding account' },
    },
  ];

  await executeTransaction(deployer, algoTxnGroup); // fund john

  let appArgs = [
    convert.stringToBytes('content'),
    convert.stringToBytes('content_hash'),
    convert.uint64ToBigEndian(1),
    convert.stringToBytes('1|2|3|67|5'),
  ];

  await deployer.deployApp(
    'main_approval.py',
    'main_clear_state.py',
    {
      sender: masterAccount,
      localInts: 8,
      localBytes: 8,
      globalInts: 3,
      globalBytes: 61,
      appArgs: appArgs,
    },
    {}
  );

  const appInfo = await deployer.getApp(
    'main_approval.py',
    'main_clear_state.py'
  );
  const appID = appInfo.appID;
  console.log(appInfo);

  try {
    await deployer.optInAccountToApp(masterAccount, appID, {}, {}); // opt-in to asc by master
    await deployer.optInAccountToApp(john, appID, {}, {});
    await deployer.optInAccountToApp(elon, appID, {}, {});
    await deployer.optInAccountToApp(alice, appID, {}, {});
    await deployer.optInAccountToApp(bob, appID, {}, {});
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}

module.exports = { default: run };
