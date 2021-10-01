/**
 * Description:
 * This file deploys the stateful smart contract to create and transfer NFT
 */
const { types } = require('@algo-builder/web');
const { convert } = require('@algo-builder/algob');
const { executeTransaction } = require('../transfer/common');

async function run(runtimeEnv, deployer) {
  const masterAccount = deployer.accountsByName.get('master-account');
  const john = deployer.accountsByName.get('john');
  const elon = deployer.accountsByName.get('elon');
  const alice = deployer.accountsByName.get('alice');
  const bob = deployer.accountsByName.get('bob');

  const appInfo = await deployer.getApp(
    'main_approval.py',
    'main_clear_state.py'
  );
  const appID = appInfo.appID;

  let appArgs = [
    convert.stringToBytes('set_income_benef_num'),
    convert.uint64ToBigEndian(1),
  ];

  // transfer nft from master to john
  // account_A = master, account_B = john
  let txnParam = {
    type: types.TransactionType.CallNoOpSSC,
    sign: types.SignType.SecretKey,
    fromAccount: masterAccount,
    appID: appID,
    payFlags: {},
    accounts: [john.addr],
    appArgs,
  };
  await executeTransaction(deployer, txnParam);

  appArgs = [
    convert.stringToBytes('set_income_benef'),
    convert.uint64ToBigEndian(0),
    convert.stringToBytes(john.addr),
    convert.uint64ToBigEndian(15),
  ];

  // transfer nft from master to john
  // account_A = master, account_B = john
  txnParam = {
    type: types.TransactionType.CallNoOpSSC,
    sign: types.SignType.SecretKey,
    fromAccount: masterAccount,
    appID: appID,
    payFlags: {},
    accounts: [masterAccount.addr],
    appArgs,
  };
  await executeTransaction(deployer, txnParam);

  /*
  appArgs = [convert.stringToBytes('pay_to')];
  const txGroup = [
    {
      type: types.TransactionType.CallNoOpSSC,
      sign: types.SignType.SecretKey,
      fromAccount: masterAccount,
      appID: appID,
      payFlags: {},
      appArgs: appArgs,
      accounts: [john.addr, alice.addr, bob.addr, elon.addr],
    },
    {
      type: types.TransactionType.TransferAlgo,
      sign: types.SignType.SecretKey,
      fromAccount: masterAccount,
      toAccountAddr: john.addr,
      amountMicroAlgos: 500,
      payFlags: {},
    },
  ];

  console.log('Transaction in process');
  await executeTransaction(deployer, txGroup);*/
}

module.exports = { default: run };
