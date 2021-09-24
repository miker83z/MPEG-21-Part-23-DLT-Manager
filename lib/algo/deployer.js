const algosdk = require('algosdk');
const devtokenAddress = '';

class AlgoDeployer {
  constructor(
    provider,
    offChainStorage,
    scSpecification,
    bindings,
    tokenAddress
  ) {
    this.provider = provider;
    this.offChainStorage = offChainStorage;

    this.algodClient = new algosdk.Algodv2(
      provider.apiToken,
      provider.baseServer,
      provider.port
    );

    if (tokenAddress === undefined) tokenAddress = devtokenAddress;

    //TODO set token contract

    this.setSCSpecification(scSpecification);
    this.setPartiesBindings(bindings);
  }

  setSCSpecification(scSpecification) {
    this.scSpecification = scSpecification === undefined ? {} : scSpecification;
  }

  setPartiesBindings(bindings) {
    if (bindings !== undefined) {
      if (this.scSpecification.parties === undefined)
        this.scSpecification.parties = {};
      Object.keys(bindings).forEach((p) => {
        this.scSpecification.parties[p] = bindings[p];
      });
    }
  }

  static fromMnemonic(mnemonic) {
    return algosdk.mnemonicToSecretKey(mnemonic);
  }

  setMainAddress(address) {
    this.mainAddress = address;
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
    for (const deonticValue of Object.values(this.scSpecification.deontics)) {
      const uri = await this.offChainStorage.publish(deonticValue.uri);
      deonticsIds.push(
        await this.newToken(
          this.scSpecification.parties[deonticValue.receiver],
          uri
        )
      );
    }
    const objectsIds = [];
    if (this.scSpecification.objects !== undefined) {
      for (const objectValue of Object.values(this.scSpecification.objects)) {
        const uri = await this.offChainStorage.publish(objectValue.uri);
        objectsIds.push(
          await this.newToken(
            objectValue.receiver !== undefined
              ? this.scSpecification.parties[objectValue.receiver]
              : this.mainAddress,
            uri
          )
        );
      }
    }
    const incomeBeneficiariesList = [];
    const incomePercentagesList = [];
    const actors = Object.keys(this.scSpecification.incomePercentage);
    for (let i = 0; i < actors.length; i++) {
      incomeBeneficiariesList.push(this.scSpecification.parties[actors[i]]);
      const beneficiaries = Object.keys(
        this.scSpecification.incomePercentage[actors[i]]
      );
      incomePercentagesList.push(beneficiaries.length);
      for (let j = 0; j < beneficiaries.length; j++) {
        incomeBeneficiariesList.push(
          this.scSpecification.parties[beneficiaries[j]]
        );
        incomePercentagesList.push(
          this.scSpecification.incomePercentage[actors[i]][beneficiaries[j]]
        );
      }
    }
    this.scSpecification.contentURI = this.scSpecification.hash =
      await this.offChainStorage.publish(this.scSpecification.contentURI);

    this.contract = new this.web3.eth.Contract(devContractArtifact.abi);
    this.contract.setProvider(this.provider);

    return await this.contract
      .deploy({
        data: devContractArtifact.bytecode,
        arguments: [
          this.web3.utils.asciiToHex('identifier'),
          Object.values(this.scSpecification.parties),
          this.token.options.address,
          deonticsIds,
          objectsIds,
          [], //TODO contract relations
          [], //TODO contract relations
          incomeBeneficiariesList,
          incomePercentagesList,
          this.scSpecification.contentURI,
          this.web3.utils.asciiToHex(this.scSpecification.hash),
        ],
      })
      .send({
        from: this.mainAddress,
        gas: this.gas,
      });
  }
}

module.exports = { AlgoDeployer };
