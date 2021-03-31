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
    const rlist = [];
    const contentUri = mco.contracts[0];
    const contentHash = web3.utils.asciiToHex(contentUri);

    const cont = await Contract.new(
      web3.utils.asciiToHex('identifier'),
      partiesAcc,
      token.address,
      dlist,
      olist,
      rlist,
      rlist,
      contentUri,
      contentHash,
      {
        from: owner,
        gas: '2500000',
      }
    );

    const a = await cont.getDeonticExpressions();
    const b = await cont.getParties();
    console.log(b);
  });
});
