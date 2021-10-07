const algosdk = require('algosdk');

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

class AlgoParser {
  constructor(provider, offChainStorage, creatorAddr, appId, nftAppId) {
    this.provider = provider;
    this.offChainStorage = offChainStorage;

    this.algodClient = new algosdk.Algodv2(
      provider.apiToken,
      provider.baseServer,
      provider.port
    );

    this.creatorAddr = creatorAddr;
    this.appId = appId;
    this.nftAppId = nftAppId;
  }

  setMainAddress(address) {
    this.mainAddress = address;
  }

  async readGlobalState(appId) {
    const accountInfoResponse = await this.algodClient
      .accountInformation(this.creatorAddr)
      .do();
    for (const app of accountInfoResponse['created-apps']) {
      if (app.id === appId) {
        return app.params['global-state'];
      }
    }
    return undefined;
  }

  async readLocalState(accountAddr, appId) {
    const accountInfoResponse = await this.algodClient
      .accountInformation(accountAddr)
      .do();
    for (const app of accountInfoResponse['apps-local-state']) {
      if (app.id === appId) {
        return app[`key-value`];
      }
    }
    return undefined;
  }

  async parseSmartContract() {
    // Get contract info
    const globalState = await this.readGlobalState(this.appId);
    let contractUri = '';
    let concatenatedNFTsID = '';
    for (const g of globalState) {
      const key = Buffer.from(g.key, 'base64').toString();
      if (key === 'contentUri') {
        contractUri = Buffer.from(g.value.bytes, 'base64').toString();
        console.log('[ALGO Parser] Content uri:', contractUri);
      }
      if (key === 'concatenatedNFTsID') {
        concatenatedNFTsID = Buffer.from(g.value.bytes, 'base64').toString();
        console.log('[ALGO Parser] NFT ids:', concatenatedNFTsID);
      }
    }
    this.mediaContract = JSON.parse(
      await this.offChainStorage.retrieve(contractUri)
    );
    console.log('[ALGO Parser] Got media contract');

    concatenatedNFTsID = concatenatedNFTsID.split('|');
    for (let i = 0; i < concatenatedNFTsID.length; i++) {
      concatenatedNFTsID[i] = parseInt(concatenatedNFTsID[i]);
    }

    const deontics = [];
    const objects = [];
    const globalStateNFT = await this.readGlobalState(this.nftAppId);
    for (const g of globalStateNFT) {
      const key = new Uint8Array(Buffer.from(g.key, 'base64'));
      if (
        key.length === 8 &&
        concatenatedNFTsID.includes(algosdk.decodeUint64(key))
      ) {
        await sleep(1000);
        const tokenUri = Buffer.from(g.value.bytes, 'base64').toString();
        const token = JSON.parse(await this.offChainStorage.retrieve(tokenUri));
        if (token.act !== undefined) deontics.push(token);
        else objects.push(token);
      }
    }
    console.log('[ALGO Parser] Got tokens');

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

    objects.forEach((object) => {
      this.mediaContract.objects[object.identifier] = object;
    });

    return this.mediaContract;
  }
}

module.exports = { AlgoParser };
