const mco = require('../../example.json');
const Contract = artifacts.require('Contract.sol');
const NFToken = artifacts.require('NFToken.sol');

contract('Contract', (accounts) => {
  var owner = accounts[0];
  var alice = accounts[1];

  it('should create a new contract and mint a new obligation to alice', async () => {
    const mcoCont = mco[mco.contracts[0]];
    const partiesAcc = accounts.slice(2, 2 + mcoCont.parties.length);

    const token = await NFToken.deployed();
    const resTok = await token.newToken(alice, mcoCont.deontics[0]);

    const dlist = [resTok.logs[0].args.tokenId];
    const olist = [new web3.utils.BN(2)];
    const relatContList = [accounts[0]];
    const relationsList = [new web3.utils.BN(1)]; //enums
    const incomeBeneficiariesList = [
      accounts[2],
      accounts[4],
      accounts[5],
      accounts[3],
      accounts[6],
    ];
    const incomePercentagesList = [
      new web3.utils.BN(2),
      new web3.utils.BN(1),
      new web3.utils.BN(50),
      new web3.utils.BN(1),
      new web3.utils.BN(20),
    ];
    const contentUri = mco.contracts[0];
    const contentHash = web3.utils.asciiToHex(contentUri);

    const cont = await Contract.new(
      web3.utils.asciiToHex('identifier'),
      partiesAcc,
      token.address,
      dlist,
      olist,
      relatContList,
      relationsList,
      incomeBeneficiariesList,
      incomePercentagesList,
      contentUri,
      contentHash,
      {
        from: owner,
        gas: '6000000',
      }
    );

    //const a = await cont.getDeonticExpressions();
    const b = await cont.getIncomePercentagesBy(accounts[2]);
    console.log(b);
  });
});
