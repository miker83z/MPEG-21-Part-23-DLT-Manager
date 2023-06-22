const {
  generateSmartContractSpecification,
  MockStorage,
  EthereumDeployer,
  EthereumParser,
} = require('./..');
const mco = require('./example.json');
const bindings = require('./bindings.json');

const generate = () => {
  return generateSmartContractSpecification(mco);
};

const deploy = async (smartContractSpecification, ipfs) => {
  const deployer = new EthereumDeployer(
    'http://127.0.0.1:8545',
    ipfs,
    smartContractSpecification,
    bindings
  );
  await deployer.setMainAddress(0);
  const res = await deployer.deploySmartContracts();
  return res.options.address;
};

const parse = async (address, ipfs) => {
  const pars = new EthereumParser('http://127.0.0.1:8545', ipfs, address);
  return await pars.parseSmartContract();
};

const main = async () => {
  const ipfs = new MockStorage();
  const smartContractSpecification = generate();
  const address = await deploy(smartContractSpecification, ipfs);
  //const address = '0x9e0B0f5E7DF524cbe3BfbfAB3E733F1a7232ccB9';
  await sleep(2000);
  console.log('Parse');
  const res = await parse(address, ipfs);
  console.log(res);
};

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

main();
