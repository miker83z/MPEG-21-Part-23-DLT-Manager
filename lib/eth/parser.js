const Web3 = require('web3');
//const Web3 = require('./../../dist/web3.min.js');
const devContractArtifact = require('../../smart-contract-templates/eth/build/contracts/Contract.json');
const devTokenArtifact = require('../../smart-contract-templates/eth/build/contracts/NFToken.json');
const devNetworkId = '5777';

class EthereumParser {
  constructor(
    provider,
    offChainStorage,
    contractAddress,
    networkId,
    contractArtifact,
    tokenArtifact
  ) {
    this.provider = provider;
    this.web3 = new Web3(provider);
    this.gas = 6000000;
    this.offChainStorage = offChainStorage;

    if (networkId === undefined) networkId = devNetworkId;
    if (contractArtifact === undefined) contractArtifact = devContractArtifact;
    if (tokenArtifact === undefined) tokenArtifact = devTokenArtifact;

    this.contract = new this.web3.eth.Contract(
      contractArtifact.abi,
      contractAddress
    );
    this.contract.setProvider(this.provider);

    this.token = new this.web3.eth.Contract(
      tokenArtifact.abi,
      tokenArtifact.networks[networkId].address
    );
    this.token.setProvider(this.provider);

    this.mediaContract = {};
  }

  async parseSmartContract() {
    // Get contract info
    const contractUri = await this.contract.methods._contentUri().call();
    this.mediaContract = JSON.parse(
      await this.offChainStorage.retrieve(contractUri)
    );

    //Get deontics token info
    const deontics = [];
    const deonticsTokensIds = await this.contract.methods
      .getDeonticExpressions()
      .call();
    for (const id of deonticsTokensIds) {
      const tokenUri = await this.token.methods.tokenURI(id).call();
      deontics.push(JSON.parse(await this.offChainStorage.retrieve(tokenUri)));
      console.log(`Token id:${id} retrieved`);
    }
    deontics.forEach((deontic) => {
      const tmpAct = JSON.parse(JSON.stringify(deontic.act));
      deontic.act = tmpAct.identifier;
      if (tmpAct.impliesAlso !== undefined) {
        for (let i = 0; i < tmpAct.impliesAlso.length; i++) {
          const tmpImpliesAlso = JSON.parse(
            JSON.stringify(tmpAct.impliesAlso[i])
          );
          tmpAct.impliesAlso[i] = tmpImpliesAlso.identifier;
          this.mediaContract.actions[tmpImpliesAlso.identifier] =
            tmpImpliesAlso;
        }
      }
      this.mediaContract.actions[tmpAct.identifier] = tmpAct;
      if (deontic.constraints !== undefined) {
        for (let i = 0; i < deontic.constraints.length; i++) {
          const tmpConstraint = JSON.parse(
            JSON.stringify(deontic.constraints[i])
          );
          deontic.constraints[i] = tmpConstraint.identifier;
          this.mediaContract.facts[tmpConstraint.identifier] = tmpConstraint;
        }
      }
      this.mediaContract.deontics[deontic.identifier] = deontic;
    });

    //Get objects token info
    const objects = [];
    const objectsTokensIds = await this.contract.methods.getObjects().call();
    for (const id of objectsTokensIds) {
      const tokenUri = await this.token.methods.tokenURI(id).call();
      objects.push(JSON.parse(await this.offChainStorage.retrieve(tokenUri)));
    }
    objects.forEach((object) => {
      this.mediaContract.objects[object.identifier] = object;
    });

    return this.mediaContract;
  }
}

module.exports = { EthereumParser };
