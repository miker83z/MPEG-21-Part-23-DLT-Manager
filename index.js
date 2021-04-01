const mco = require('./example.json');
const web3 = require('web3');

const generateSmartContract = (contract) => {
  const paymentsBeneficiaries = new Set();
  const payTo = {};
  const shareWith = {};
  const contractObj = contract[contract.contracts[0]];

  contractObj.actions.forEach((actId) => {
    const act = contract[actId];
    if (act.type === 'Payment') {
      const actor = act.actedBy;
      const beneficiary = act.beneficiaries[0];

      if (act.amount !== undefined) {
        if (payTo[actor] === undefined) payTo[actor] = {};
        payTo[actor][beneficiary] = act.amount;
      } else if (act.incomePercentage !== undefined) {
        if (shareWith[actor] === undefined) shareWith[actor] = {};
        shareWith[actor][beneficiary] = act.incomePercentage;
      }
    }
  });
};

const sc = generateSmartContract(mco);
console.log(sc);
