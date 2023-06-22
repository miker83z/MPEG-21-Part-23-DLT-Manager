const { generateSmartContractSpecification } = require('./lib/generator');
const { OffChainStorage } = require('./lib/storage/offChainStorage');
const { MockStorage } = require('./lib/storage/mockStorage');
const { EthereumDeployer } = require('./lib/eth/deployer');
const { EthereumParser } = require('./lib/eth/parser');

module.exports = {
  generateSmartContractSpecification,
  MockStorage,
  OffChainStorage,
  EthereumDeployer,
  EthereumParser,
};
