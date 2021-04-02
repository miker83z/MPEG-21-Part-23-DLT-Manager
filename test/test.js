const {
  OffChainStorage,
  SmartContractGenerator,
  SmartContractParser,
} = require('./..');
const mco = require('./example.json');
const bindings = require('./bindings.json');

const generate = async () => {
  const ipfs = new OffChainStorage();
  const gen = new SmartContractGenerator('http://127.0.0.1:8545', ipfs);
  await gen.setMainAddress(0);
  gen.generateMediaSmartContract(mco);
  gen.setPartiesBindings(bindings);
  const res = await gen.deploySmartContracts();
  return res.options.address;
};

const parse = async (address) => {
  const ipfs = new OffChainStorage();
  const pars = new SmartContractParser('http://127.0.0.1:8545', ipfs, address);
  return await pars.parseSmartContract();
};

const main = async () => {
  //const address = await generate();
  const address = '0xD8128ff706c09512fb26d645e8eBFa80D301873d';
  const res = await parse(address);
  console.log(res);
};

main();
