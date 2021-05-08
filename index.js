const { generateMediaSmartContract } = require('./lib/generator');
const { OffChainStorage } = require('./lib/offChainStorage');
const { SmartContractDeployer } = require('./lib/deployer');
const { SmartContractParser } = require('./lib/parser');

module.exports = {
  generateMediaSmartContract,
  OffChainStorage,
  SmartContractDeployer,
  SmartContractParser,
};
