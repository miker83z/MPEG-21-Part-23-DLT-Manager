const Web3 = require('web3');
const devContractArtifact = require('../smart-contract-template/build/contracts/Contract.json');
const devTokenArtifact = require('../smart-contract-template/build/contracts/NFToken.json');
const devNetworkId = '5777';

class SmartContractGenerator {
  constructor(provider, offChainStorage, networkId, tokenArtifact) {
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

    this.mediaSC = {};
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

    return tokenId;
  }

  generateMediaSmartContract(mediaContract) {
    const contractObj = mediaContract[mediaContract.contracts[0]];
    // Identifier
    this.mediaSC.identifier = contractObj.identifier;
    // Parties
    this.mediaSC.parties = {};
    contractObj.parties.forEach((p) => {
      this.mediaSC.parties[p] = '';
    });
    //NFToken
    this.mediaSC.nfToken = this.token.options.address;
    //Deontic Expression
    this.mediaSC.deontics = {};
    contractObj.deontics.forEach((deonticId) => {
      const tmpDeontic = JSON.parse(JSON.stringify(mediaContract[deonticId]));
      tmpDeontic.act = JSON.parse(
        JSON.stringify(mediaContract[tmpDeontic.act])
      );
      if (tmpDeontic.act.impliesAlso !== undefined) {
        for (let i = 0; i < tmpDeontic.act.impliesAlso.length; i++) {
          tmpDeontic.act.impliesAlso[i] = JSON.parse(
            JSON.stringify(mediaContract[tmpDeontic.act.impliesAlso[i]])
          );
        }
      }
      if (tmpDeontic.constraints !== undefined) {
        for (let i = 0; i < tmpDeontic.constraints.length; i++) {
          tmpDeontic.constraints[i] = JSON.parse(
            JSON.stringify(mediaContract[tmpDeontic.constraints[i]])
          );
        }
      }
      this.mediaSC.deontics[deonticId] = {
        uri: JSON.stringify(tmpDeontic),
        receiver: mediaContract[deonticId].actedBySubject,
      };
    });
    //Objects
    if (contractObj.objects !== undefined) {
      this.mediaSC.objects = {};
      contractObj.objects.forEach((objectId) => {
        this.mediaSC.objects[objectId] = {
          uri: JSON.stringify(mediaContract[objectId]),
          receiver:
            mediaContract[objectId].rightsOwners !== undefined
              ? mediaContract[objectId].rightsOwners[0]
              : undefined,
        };
      });
    }
    //Contracts relations
    if (contractObj.contractRelations !== undefined) {
      //TODO
    }
    // Income percentage
    // const payTo = {};
    this.mediaSC.incomePercentage = {};
    contractObj.actions.forEach((actId) => {
      const act = mediaContract[actId];
      if (act.type === 'Payment') {
        const actor = act.actedBy;
        const beneficiary = act.beneficiaries[0];

        /*if (act.amount !== undefined) {
        if (payTo[actor] === undefined) payTo[actor] = {};
        payTo[actor][beneficiary] = act.amount;
      } else*/
        if (act.incomePercentage !== undefined) {
          if (this.mediaSC.incomePercentage[actor] === undefined)
            this.mediaSC.incomePercentage[actor] = {};
          this.mediaSC.incomePercentage[actor][beneficiary] =
            act.incomePercentage;
        }
      }
    });
    // Content URI
    this.mediaSC.contentURI = JSON.stringify(mediaContract);
    // Content hash
    this.mediaSC.hash = 'hash';
  }

  setPartiesBindings(bindings) {
    if (this.mediaSC.parties === undefined) this.mediaSC.parties = {};
    Object.keys(bindings).forEach((p) => {
      this.mediaSC.parties[p] = bindings[p];
    });
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
    this.mediaSC.contentURI = this.mediaSC.hash = await this.offChainStorage.publish(
      this.mediaSC.contentURI
    );

    this.contract = new this.web3.eth.Contract(devContractArtifact.abi);
    this.contract.setProvider(this.provider);

    return await this.contract
      .deploy({
        data: devContractArtifact.bytecode,
        arguments: [
          this.web3.utils.asciiToHex('identifier'),
          Object.values(this.mediaSC.parties),
          this.mediaSC.nfToken,
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

module.exports = { SmartContractGenerator };
