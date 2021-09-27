/**
 * Description:
 * This file deploys the stateful smart contract to create and transfer NFT
 */
const { types } = require('@algo-builder/web');
const { convert } = require('@algo-builder/algob');
const { executeTransaction } = require('./transfer/common');

async function run(runtimeEnv, deployer) {
  const masterAccount = deployer.accountsByName.get('master-account');

  let appArgs = ['contentmcocel'].map(convert.stringToBytes);

  await deployer.deployApp(
    'main_approval.py',
    'main_clear_state.py',
    {
      sender: masterAccount,
      localInts: 16,
      globalInts: 1,
      globalBytes: 63,
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
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}

module.exports = { default: run };
