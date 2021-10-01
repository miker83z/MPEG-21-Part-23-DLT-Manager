/**
 * Description:
 * This file deploys the stateful smart contract to create and transfer NFT
 */
const { types } = require('@algo-builder/web');
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

  await deployer.deployApp(
    'nft_approval.py',
    'nft_clear_state.py',
    {
      sender: masterAccount,
      localInts: 16,
      globalInts: 1,
      globalBytes: 63,
    },
    {}
  );

  const appInfo = await deployer.getApp(
    'nft_approval.py',
    'nft_clear_state.py'
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
