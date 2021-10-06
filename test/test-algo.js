const {
  generateSmartContractSpecification,
  OffChainStorage,
  AlgoDeployer,
  AlgoParser,
} = require('./..');
const mco = require('./example.json');
const bindings = require('./bindings-algo.json');
const master = AlgoDeployer.fromMnemonic(
  'enforce drive foster uniform cradle tired win arrow wasp melt cattle chronic sport dinosaur announce shell correct shed amused dismiss mother jazz task above hospital'
);
const john = AlgoDeployer.fromMnemonic(
  'found empower message suit siege arrive dad reform museum cake evoke broom comfort fluid flower wheat gasp baby auction tuna sick case camera about flip'
);
const elon = AlgoDeployer.fromMnemonic(
  'resist derive table space jealous person pink ankle hint venture manual spawn move harbor flip cigar copy throw swap night series hybrid chest absent art'
);
const alice = AlgoDeployer.fromMnemonic(
  'brand globe reason guess allow wear roof leisure season coin own pen duck worth virus silk jazz pitch behave jazz leisure pave unveil absorb kick'
);
const bob = AlgoDeployer.fromMnemonic(
  'caution fuel omit buzz six unique method kiwi twist afraid monitor song leader mask bachelor siege what shiver fringe else mass hero deposit absorb tooth'
);

const generate = () => {
  return generateSmartContractSpecification(mco);
};

const setupAlgo = async (deployer) => {
  await deployer.pay(deployer.mainAddress, john.addr, 401000000);
  await deployer.pay(deployer.mainAddress, elon.addr, 401000000);
  await deployer.pay(deployer.mainAddress, alice.addr, 401000000);
  await deployer.pay(deployer.mainAddress, bob.addr, 401000000);
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
  await deployer.setMainAddress(master);
  //await setupAlgo(deployer);
  return await deployer.deploySmartContracts([master, john, elon, alice, bob]);
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
