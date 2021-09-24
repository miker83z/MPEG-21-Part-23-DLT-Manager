const {
  generateSmartContractSpecification,
  OffChainStorage,
  EthereumDeployer,
  EthereumParser,
} = require('./..');
const mco = require('./example.json');
const bindings = require('./bindings.json');

const HDWalletProvider = require('@truffle/hdwallet-provider');
const fs = require('fs');
const secret = fs.readFileSync('.secret').toString();
const infuraKey = secret.substr(0, secret.indexOf(' '));
const mnemonic = secret.substr(secret.indexOf(' ')).trim();

const generate = () => {
  return generateSmartContractSpecification(mco);
};

const deployRopsten = async (smartContractSpecification) => {
  const ropstenProvider = new HDWalletProvider(
    mnemonic,
    `https://ropsten.infura.io/v3/` + infuraKey
  );
  const ipfs = new OffChainStorage();
  const deployer = new EthereumDeployer(
    ropstenProvider,
    ipfs,
    smartContractSpecification,
    bindings,
    3
  );
  await deployer.setMainAddress('0xa40637a7F5F3776186d89d2BA77260d98624C4ce');
  const res = await deployer.deploySmartContracts();
  return res.options.address;
};

const parseRopsten = async (address) => {
  const ipfs = new OffChainStorage();
  const pars = new EthereumParser(
    `https://ropsten.infura.io/v3/` + infuraKey,
    ipfs,
    address,
    3
  );
  return await pars.parseSmartContract();
};

const mainRopsten = async () => {
  const smartContractSpecification = generate();
  //const address = await deployRopsten(smartContractSpecification);
  await sleep(2000);
  const res = await parseRopsten('0xD55e47986E5C990a691edcf04436d35253d2bE2B');
  console.log(res);
};

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

main();
