const Web3 = require('web3');
//const Web3 = require('./../dist/web3.min.js');
const devContractArtifact = require('../../smart-contract-templates/eth/build/contracts/Contract.json');
const devTokenArtifact = require('../../smart-contract-templates/eth/build/contracts/NFToken.json');
const devNetworkId = '5777';

class EthereumDeployer {
  constructor(
    provider,
    offChainStorage,
    mediaSC,
    bindings,
    networkId,
    tokenArtifact
  ) {
    this.provider = provider;
    this.web3 = new Web3(provider);
    this.gas = 6000000;
    this.offChainStorage = offChainStorage;

    if (networkId === undefined) networkId = devNetworkId;
    if (tokenArtifact === undefined) tokenArtifact = devTokenArtifact;

    this.token = new this.web3.eth.Contract(
      tokenArtifact.abi,
      tokenArtifact.networks[networkId].address
    );
    this.token.setProvider(this.provider);

    this.setMediaSC(mediaSC);
    this.setPartiesBindings(bindings);
  }

  setMediaSC(mediaSC) {
    this.mediaSC = mediaSC === undefined ? {} : mediaSC;
  }

  setPartiesBindings(bindings) {
    if (bindings !== undefined) {
      if (this.mediaSC.parties === undefined) this.mediaSC.parties = {};
      Object.keys(bindings).forEach((p) => {
        this.mediaSC.parties[p] = bindings[p];
      });
    }
  }

  async setMainAddress(addressIndex) {
    const accounts = await this.web3.eth.getAccounts();
    this.mainAddress = accounts[addressIndex];
  }

  async newToken(receiver, uri) {
    const res = await this.token.methods
      .newToken(receiver, uri)
      .send({ from: this.mainAddress, gas: this.gas });
    const tokenId = res.events['Transfer'].returnValues['tokenId'];
    console.log(`Token id:${tokenId} deployed`);

    return tokenId;
  }

  async deploySmartContracts() {
    const deonticsIds = [];
    for (const deonticValue of Object.values(this.mediaSC.deontics)) {
      const uri = await this.offChainStorage.publish(deonticValue.uri);
      deonticsIds.push(
        await this.newToken(this.mediaSC.parties[deonticValue.receiver], uri)
      );
    }
    const objectsIds = [];
    if (this.mediaSC.objects !== undefined) {
      for (const objectValue of Object.values(this.mediaSC.objects)) {
        const uri = await this.offChainStorage.publish(objectValue.uri);
        objectsIds.push(
          await this.newToken(
            objectValue.receiver !== undefined
              ? this.mediaSC.parties[objectValue.receiver]
              : this.mainAddress,
            uri
          )
        );
      }
    }
    const incomeBeneficiariesList = [];
    const incomePercentagesList = [];
    const actors = Object.keys(this.mediaSC.incomePercentage);
    for (let i = 0; i < actors.length; i++) {
      incomeBeneficiariesList.push(this.mediaSC.parties[actors[i]]);
      const beneficiaries = Object.keys(
        this.mediaSC.incomePercentage[actors[i]]
      );
      incomePercentagesList.push(beneficiaries.length);
      for (let j = 0; j < beneficiaries.length; j++) {
        incomeBeneficiariesList.push(this.mediaSC.parties[beneficiaries[j]]);
        incomePercentagesList.push(
          this.mediaSC.incomePercentage[actors[i]][beneficiaries[j]]
        );
      }
    }
    this.mediaSC.contentURI = this.mediaSC.hash =
      await this.offChainStorage.publish(this.mediaSC.contentURI);

    this.contract = new this.web3.eth.Contract(devContractArtifact.abi);
    this.contract.setProvider(this.provider);

    return await this.contract
      .deploy({
        data: devContractArtifact.bytecode,
        arguments: [
          this.web3.utils.asciiToHex('identifier'),
          Object.values(this.mediaSC.parties),
          this.token.options.address,
          deonticsIds,
          objectsIds,
          [], //TODO contract relations
          [], //TODO contract relations
          incomeBeneficiariesList,
          incomePercentagesList,
          this.mediaSC.contentURI,
          this.web3.utils.asciiToHex(this.mediaSC.hash),
        ],
      })
      .send({
        from: this.mainAddress,
        gas: this.gas,
      });
  }
}

module.exports = { EthereumDeployer };
