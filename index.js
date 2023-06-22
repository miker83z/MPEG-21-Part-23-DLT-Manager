const { generateSmartContractSpecification } = require('./lib/generator');
const { OffChainStorage } = require('./lib/offChainStorage');
const { MockStorage } = require('./lib/mockStorage');
const { EthereumDeployer } = require('./lib/eth/deployer');
const { EthereumParser } = require('./lib/eth/parser');
const { AlgoDeployer } = require('./lib/algo/deployer');
const { AlgoParser } = require('./lib/algo/parser');

module.exports = {
  generateSmartContractSpecification,
  MockStorage,
  OffChainStorage,
  EthereumDeployer,
  EthereumParser,
  AlgoDeployer,
  AlgoParser,
};
