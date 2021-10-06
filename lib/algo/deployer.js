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
    console.log(
      '[ALGO Deploy] Awaiting confirmation (this will take several seconds)...'
    );
    const roundTimeout = 2;
    const completedTx = await this.waitForConfirmation(txnId, roundTimeout);
    console.log('[ALGO Deploy] Transaction successful.');
    return completedTx;
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
    console.log('[ALGO Deploy] Payment.');
    let signedTxn = txn.signTxn(from.sk);
    const { txId: payTxId } = await this.algodClient
      .sendRawTransaction(signedTxn)
      .do();

    // wait for confirmation
    return await this.verboseWaitForConfirmation(payTxId);
  }

  async optInApp(appId, account) {
    const suggestedParams = await this.algodClient.getTransactionParams().do();
    const optInTxn = algosdk.makeApplicationOptInTxn(
      account.addr,
      suggestedParams,
      appId
    );

    // send the transaction
    console.log('[ALGO Deploy] Sending application opt in transaction.');
    const signedOptInTxn = optInTxn.signTxn(account.sk);
    const { txId: optInTxId } = await this.algodClient
      .sendRawTransaction(signedOptInTxn)
      .do();

    // wait for confirmation
    return await this.verboseWaitForConfirmation(optInTxId);
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
    console.log('[ALGO Deploy] Sending NFT application creation transaction.');
    const signedCreateTxn = createTxn.signTxn(this.mainAddress.sk);
    const { txId: createTxId } = await this.algodClient
      .sendRawTransaction(signedCreateTxn)
      .do();

    // wait for confirmation
    return await this.verboseWaitForConfirmation(createTxId);
  }

  async newToken(appId, uri) {
    const suggestedParams = await this.algodClient.getTransactionParams().do();
    const appArgs = [
      new Uint8Array(Buffer.from('create')),
      new Uint8Array(Buffer.from(uri)),
      new Uint8Array(Buffer.from(uri)),
    ];

    const noOpTxn = algosdk.makeApplicationNoOpTxn(
      this.mainAddress.addr,
      suggestedParams,
      appId,
      appArgs
    );

    // send the transaction
    console.log('[ALGO Deploy] Creating new NFT.');
    const signedNoOpTxn = noOpTxn.signTxn(this.mainAddress.sk);
    const { txId: noOpTxnId } = await this.algodClient
      .sendRawTransaction(signedNoOpTxn)
      .do();

    // wait for confirmation
    const res = await this.verboseWaitForConfirmation(noOpTxnId);

    return res['global-state-delta'].filter((obj) => {
      return obj.key === 'dG90YWw=';
    })[0].value.uint;
  }

  async transferToken(appId, from, toAddr, nftID) {
    const suggestedParams = await this.algodClient.getTransactionParams().do();
    const appArgs = [
      new Uint8Array(Buffer.from('transfer')),
      algosdk.encodeUint64(nftID),
    ];
    const accounts = [from.addr, toAddr];

    const noOpTxn = algosdk.makeApplicationNoOpTxn(
      from.addr,
      suggestedParams,
      appId,
      appArgs,
      accounts
    );

    // send the transaction
    console.log('[ALGO Deploy] Transfering NFT.');
    const signedNoOpTxn = noOpTxn.signTxn(from.sk);
    const { txId: noOpTxnId } = await this.algodClient
      .sendRawTransaction(signedNoOpTxn)
      .do();

    // wait for confirmation
    return await this.verboseWaitForConfirmation(noOpTxnId);
  }

  async deployMainContract(content, hash, tokensNum, tokenIdsString) {
    // define application parameters
    const from = this.mainAddress;
    const onComplete = algosdk.OnApplicationComplete.NoOpOC;
    const approvalProgram = await this.getBasicProgramBytes(
      mainSmartContract.approval
    );
    const clearProgram = await this.getBasicProgramBytes(
      mainSmartContract.clear
    );
    const numLocalInts = 8;
    const numLocalByteSlices = 8;
    const numGlobalInts = 3;
    const numGlobalByteSlices = 61;
    const appArgs = [
      new Uint8Array(Buffer.from(content)),
      new Uint8Array(Buffer.from(hash)),
      algosdk.encodeUint64(tokensNum),
      new Uint8Array(Buffer.from(tokenIdsString)),
    ];

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
    console.log('[ALGO Deploy] Sending main application creation transaction.');
    const signedCreateTxn = createTxn.signTxn(this.mainAddress.sk);
    const { txId: createTxId } = await this.algodClient
      .sendRawTransaction(signedCreateTxn)
      .do();

    // wait for confirmation
    return await this.verboseWaitForConfirmation(createTxId);
  }

  async setIncomeBeneficiaries(appId, accountAddress, benefNum, beneficiaries) {
    const suggestedParams = await this.algodClient.getTransactionParams().do();
    let appArgs = [
      new Uint8Array(Buffer.from('set_income_benef_num')),
      algosdk.encodeUint64(benefNum),
    ];
    const accounts = [accountAddress];

    const noOpTxn = algosdk.makeApplicationNoOpTxn(
      this.mainAddress.addr,
      suggestedParams,
      appId,
      appArgs,
      accounts
    );

    // send the transaction
    console.log('[ALGO Deploy] Setting Income Beneficiaries Number.');
    const signedNoOpTxn = noOpTxn.signTxn(this.mainAddress.sk);
    const { txId: noOpTxnId } = await this.algodClient
      .sendRawTransaction(signedNoOpTxn)
      .do();

    // wait for confirmation
    await this.verboseWaitForConfirmation(noOpTxnId);

    for (let i = 0; i < Object.keys(beneficiaries).length; i++) {
      const accountToSet = Object.keys(beneficiaries)[i];
      appArgs = [
        new Uint8Array(Buffer.from('set_income_benef')),
        algosdk.encodeUint64(i),
        new Uint8Array(Buffer.from(accountToSet)),
        algosdk.encodeUint64(beneficiaries[accountToSet]),
      ];

      const loopTx = algosdk.makeApplicationNoOpTxn(
        this.mainAddress.addr,
        suggestedParams,
        appId,
        appArgs,
        accounts
      );

      // send the transaction
      console.log('[ALGO Deploy] Setting Income Beneficiaries.');
      const signedloopTx = loopTx.signTxn(this.mainAddress.sk);
      const { txId: loopTxId } = await this.algodClient
        .sendRawTransaction(signedloopTx)
        .do();

      // wait for confirmation
      await this.verboseWaitForConfirmation(loopTxId);
    }
  }

  async deploySmartContracts(accounts) {
    // deploy token
    const res = await this.deployToken();
    const appId = res['application-index'];
    for (let i = 0; i < accounts.length; i++) {
      await this.optInApp(appId, accounts[i]);
    }

    // token data
    const tokenIds = [];
    for (const deonticValue of Object.values(this.scSpecification.deontics)) {
      const uri = await this.offChainStorage.publish(deonticValue.uri);
      const tokenId = await this.newToken(appId, uri);
      tokenIds.push(tokenId);
      await this.transferToken(
        appId,
        this.mainAddress,
        this.scSpecification.parties[deonticValue.receiver],
        tokenId
      );
    }
    if (this.scSpecification.objects !== undefined) {
      for (const objectValue of Object.values(this.scSpecification.objects)) {
        const uri = await this.offChainStorage.publish(objectValue.uri);
        const tokenId = await this.newToken(appId, uri);
        tokenIds.push(tokenId);
        if (objectValue.receiver !== undefined) {
          await this.transferToken(
            appId,
            this.mainAddress,
            this.scSpecification.parties[objectValue.receiver],
            tokenId
          );
        }
      }
    }

    // deploy main contract
    this.scSpecification.contentURI = this.scSpecification.hash = await this.offChainStorage.publish(
      this.scSpecification.contentURI
    );
    const res2 = await this.deployMainContract(
      this.scSpecification.contentURI,
      this.scSpecification.hash,
      tokenIds.length,
      '1|2|3' //TODO concatenate token ids
    );
    const appId2 = res2['application-index'];
    for (let i = 0; i < accounts.length; i++) {
      await this.optInApp(appId2, accounts[i]);
    }

    //conpute income percentages
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

    const _incomePercentages = {};
    for (let i = 0; i < incomePercentagesList.length; ) {
      if (_incomePercentages[incomeBeneficiariesList[i]] == undefined)
        _incomePercentages[incomeBeneficiariesList[i]] = {};
      let asd = _incomePercentages[incomeBeneficiariesList[i]];
      let shares = incomePercentagesList[i++];
      for (let j = 0; j < shares; j++) {
        asd[incomeBeneficiariesList[i]] = incomePercentagesList[i++];
      }
    }

    // set income percentage
    for (let i = 0; i < Object.keys(_incomePercentages).length; i++) {
      const accountAddress = Object.keys(_incomePercentages)[i];
      await this.setIncomeBeneficiaries(
        appId2,
        accountAddress,
        Object.keys(_incomePercentages[accountAddress]).length,
        _incomePercentages[accountAddress]
      );
    }

    return appId2;
  }
}

module.exports = { AlgoDeployer };
