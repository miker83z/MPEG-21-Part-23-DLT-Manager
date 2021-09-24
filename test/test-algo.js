const {
  generateSmartContractSpecification,
  OffChainStorage,
  AlgoDeployer,
  AlgoParser,
} = require('./..');
const mco = require('./example.json');
const bindings = require('./bindings-algo.json');
const mnemonic =
  'enforce drive foster uniform cradle tired win arrow wasp melt cattle chronic sport dinosaur announce shell correct shed amused dismiss mother jazz task above hospital';

const generate = () => {
  return generateSmartContractSpecification(mco);
};

const deploy = async (smartContractSpecification) => {
  const ipfs = new OffChainStorage();
  const provider = {
    apiToken:
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    baseServer: 'http://localhost',
    port: '4001',
  };
  const deployer = new AlgoDeployer(
    provider,
    ipfs,
    smartContractSpecification,
    bindings
  );
  const mainAddr = AlgoDeployer.fromMnemonic(mnemonic);
  await deployer.setMainAddress(mainAddr);
  //const res = await deployer.deploySmartContracts();
  //return res.options.address;
};

const main = async () => {
  const smartContractSpecification = generate();
  const address = await deploy(smartContractSpecification);
  //await sleep(2000);
  //console.log('Parse');
  //const res = await parse(address);
  //console.log(res);
};

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

main();
