const NFToken = artifacts.require('NFToken.sol');

module.exports = function (deployer) {
  return deployer.deploy(NFToken, 'NFToken', 'NFT');
};
