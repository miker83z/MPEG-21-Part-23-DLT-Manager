const ipfsAPI = require('ipfs-http-client');
const uint8ArrayConcat = require('uint8arrays/concat');
const uint8ArrayToString = require('uint8arrays/to-string');

class MockStorage {
  constructor() {
    this.storage = {};
  }

  async publish(payload) {
    let cid = this.makeid(15);
    console.log('[MOCK] Publishing payload');
    this.storage[cid] = payload;
    // JSON.stringify(payload);
    console.log('[MOCK] Published ', cid);
    return cid;
  }

  async retrieve(cid) {
    console.log('[MOCK] Retrieving ', cid);
    return this.storage[cid];
  }

  makeid(length) {
    let result = '';
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }
}

module.exports = { MockStorage };
