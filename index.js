const mco = require('./example.json');
const Web3 = require('web3');
const contractArtifact = require('./smart-contract-template/build/contracts/Contract.json');
const tokenArtifact = require('./smart-contract-template/build/contracts/NFToken.json');
const devNetworkId = '5777';

const handleToken = (address, artifact);

class SmartContractGenerator {
  constructor(provider, networkId) {
    this.provider = provider;
    this.web3 = new Web3(provider);
    this.gas = 1000000;

    this.token = new this.web3.eth.Contract(
      tokenArtifact.abi,
      tokenArtifact.networks[networkId].address
    );
    this.token.setProvider(this.provider);
  }

  async setMainAddress(address) {
    if (address != undefined) {
      this.mainAddress = address;
    } else if (typeof address === 'number') {
      const accounts = await this.web3.eth.getAccounts();
      this.mainAddress = accounts[address];
    }
  }

  async newToken(receiver, uri) {
    const res = await this.token.methods
      .newToken(receiver, uri)
      .send({ from: this.mainAddress, gas: this.gas });
    const tokenId = res.logs[0].args.tokenId;

    return tokenId;
  }

  generateSmartContract(contract) {
    const contractObj = contract[contract.contracts[0]];

    // Identifier
    const identifier = contract.contracts[0];
    // Parties
    const parties = contract.parties;
    //NFToken
    //Deontic Expression
    const deotics = contract.deontics;
    //Objects
    const objects = contract.objects;
    //Contracts relations

    // Income percentage
    // const payTo = {};
    const incomePercentage = {};
    contractObj.actions.forEach((actId) => {
      const act = contract[actId];
      if (act.type === 'Payment') {
        const actor = act.actedBy;
        const beneficiary = act.beneficiaries[0];

        /*if (act.amount !== undefined) {
        if (payTo[actor] === undefined) payTo[actor] = {};
        payTo[actor][beneficiary] = act.amount;
      } else*/
        if (act.incomePercentage !== undefined) {
          if (incomePercentage[actor] === undefined)
            incomePercentage[actor] = {};
          incomePercentage[actor][beneficiary] = act.incomePercentage;
        }
      }
    });
  }
}

const sc = generateSmartContract(mco);
console.log(sc);
