const algosdk = require('algosdk');
const fs = require('fs');
const nftSmartContract = require('../../smart-contract-templates/algo/assets/teal/nft.json');
const mainSmartContract = require('../../smart-contract-templates/algo/assets/teal/main.json');

class AlgoDeployer {
  constructor(provider, offChainStorage, scSpecification, bindings) {
    this.provider = provider;
    this.offChainStorage = offChainStorage;

    this.algodClient = new algosdk.Algodv2(
      provider.apiToken,
      provider.baseServer,
      provider.port
    );

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

  async getBasicProgramBytes(program) {
    // use algod to compile the program
    const compiledProgram = await this.algodClient.compile(program).do();
    return new Uint8Array(Buffer.from(compiledProgram.result, 'base64'));
  }

  /**
   * Wait for confirmation — timeout after 2 rounds
   */
  async waitForConfirmation(txId, timeout) {
    if (txId == null || timeout < 0) {
      throw new Error('Bad arguments.');
    }
    const status = await this.algodClient.status().do();
    if (typeof status === 'undefined')
      throw new Error('Unable to get node status');
    const startround = status['last-round'] + 1;
    let currentround = startround;

    /* eslint-disable no-await-in-loop */
    while (currentround < startround + timeout) {
      const pendingInfo = await this.algodClient
        .pendingTransactionInformation(txId)
        .do();
      if (pendingInfo !== undefined) {
        if (
          pendingInfo['confirmed-round'] !== null &&
          pendingInfo['confirmed-round'] > 0
        ) {
          // Got the completed Transaction
          return pendingInfo;
        }

        if (
          pendingInfo['pool-error'] != null &&
          pendingInfo['pool-error'].length > 0
        ) {
          // If there was a pool error, then the transaction has been rejected!
          throw new Error(
            `Transaction Rejected pool error${pendingInfo['pool-error']}`
          );
        }
      }
      await this.algodClient.statusAfterBlock(currentround).do();
      currentround += 1;
    }
    /* eslint-enable no-await-in-loop */
    throw new Error(`Transaction not confirmed after ${timeout} rounds!`);
  }

  async verboseWaitForConfirmation(txnId) {
    console.log('Awaiting confirmation (this will take several seconds)...');
    const roundTimeout = 2;
    const completedTx = await this.waitForConfirmation(txnId, roundTimeout);
    console.log('Transaction successful.');
    return completedTx;
  }

  async deployToken() {
    // define application parameters
    const from = this.mainAddress;
    const onComplete = algosdk.OnApplicationComplete.NoOpOC;
    const approvalProgram = await this.getBasicProgramBytes(
      nftSmartContract.approval
    );
    const clearProgram = await this.getBasicProgramBytes(
      nftSmartContract.clear
    );
    const numLocalInts = 16;
    const numLocalByteSlices = 0;
    const numGlobalInts = 1;
    const numGlobalByteSlices = 63;
    const appArgs = [];

    // get suggested params
    const suggestedParams = await this.algodClient.getTransactionParams().do();

    // create the application creation transaction
    const createTxn = algosdk.makeApplicationCreateTxn(
      from.addr,
      suggestedParams,
      onComplete,
      approvalProgram,
      clearProgram,
      numLocalInts,
      numLocalByteSlices,
      numGlobalInts,
      numGlobalByteSlices,
      appArgs
    );

    // send the transaction
    console.log('Sending application creation transaction.');
    const signedCreateTxn = createTxn.signTxn(this.mainAddress.sk);
    const { txId: createTxId } = await this.algodClient
      .sendRawTransaction(signedCreateTxn)
      .do();

    // wait for confirmation
    return await this.verboseWaitForConfirmation(createTxId);
  }

  async optInApp(appId, account) {
    const suggestedParams = await this.algodClient.getTransactionParams().do();
    const optInTxn = algosdk.makeApplicationOptInTxn(
      account.addr,
      suggestedParams,
      appId
    );

    // send the transaction
    console.log('Sending application opt in transaction.');
    const signedOptInTxn = optInTxn.signTxn(account.sk);
    const { txId: optInTxId } = await this.algodClient
      .sendRawTransaction(signedOptInTxn)
      .do();

    // wait for confirmation
    return await this.verboseWaitForConfirmation(optInTxId);
  }

  async pay(from, toAddr, amount) {
    const suggestedParams = await this.algodClient.getTransactionParams().do();
    suggestedParams.fee = 1000;
    suggestedParams.flatFee = true;

    let txn = algosdk.makePaymentTxnWithSuggestedParams(
      from.addr,
      toAddr,
      amount,
      undefined,
      undefined,
      suggestedParams
    );

    // send the transaction
    console.log('Payment.');
    let signedTxn = txn.signTxn(from.sk);
    const { txId: payTxId } = await this.algodClient
      .sendRawTransaction(signedTxn)
      .do();

    // wait for confirmation
    return await this.verboseWaitForConfirmation(payTxId);
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
