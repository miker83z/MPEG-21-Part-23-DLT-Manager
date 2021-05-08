const {
  generateMediaSmartContract,
  OffChainStorage,
  SmartContractDeployer,
  SmartContractParser,
} = require('./..');
const mco = require('./example.json');
const bindings = require('./bindings.json');

const HDWalletProvider = require('@truffle/hdwallet-provider');
const fs = require('fs');
const secret = fs.readFileSync('.secret').toString();
const infuraKey = secret.substr(0, secret.indexOf(' '));
const mnemonic = secret.substr(secret.indexOf(' ')).trim();

const generate = () => {
  return generateMediaSmartContract(mco);
};

const deploy = async (mediaSC) => {
  const ipfs = new OffChainStorage();
  const deployer = new SmartContractDeployer(
    'http://127.0.0.1:8545',
    ipfs,
    mediaSC,
    bindings
  );
  await deployer.setMainAddress(0);
  const res = await deployer.deploySmartContracts();
  return res.options.address;
};

const parse = async (address) => {
  const ipfs = new OffChainStorage();
  const pars = new SmartContractParser('http://127.0.0.1:8545', ipfs, address);
  return await pars.parseSmartContract();
};

const deployRopsten = async (mediaSC) => {
  const ropstenProvider = new HDWalletProvider(
    mnemonic,
    `https://ropsten.infura.io/v3/` + infuraKey
  );
  const ipfs = new OffChainStorage();
  const deployer = new SmartContractDeployer(
    ropstenProvider,
    ipfs,
    mediaSC,
    bindings,
    3
  );
  await deployer.setMainAddress('0xa40637a7F5F3776186d89d2BA77260d98624C4ce');
  const res = await deployer.deploySmartContracts();
  return res.options.address;
};

const parseRopsten = async (address) => {
  const ipfs = new OffChainStorage();
  const pars = new SmartContractParser(
    `https://ropsten.infura.io/v3/` + infuraKey,
    ipfs,
    address,
    3
  );
  return await pars.parseSmartContract();
};

const mainRopsten = async () => {
  const mediaSC = generate();
  //const address = await deployRopsten(mediaSC);
  const res = await parseRopsten('0xD55e47986E5C990a691edcf04436d35253d2bE2B');
  console.log(res);
};

const main = async () => {
  const mediaSC = generate();
  //const address = await deploy(mediaSC);
  const address = '0x9e0B0f5E7DF524cbe3BfbfAB3E733F1a7232ccB9';
  const res = await parseRopsten(address);
  console.log(res);
};

main();
