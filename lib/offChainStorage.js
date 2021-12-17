const ipfsAPI = require('ipfs-http-client');
const uint8ArrayConcat = require('uint8arrays/concat');
const uint8ArrayToString = require('uint8arrays/to-string');

class OffChainStorage {
  constructor() {
    this.ipfsService = ipfsAPI({
      //host: 'ipfs.infura.io:5001/api/v0',
      host: 'scm.linkeddata.es:443/api/v0',
      //port: 5001,
      protocol: 'https',
    });
  }

  async publish(payload) {
    console.log('[IPFS] Publishing payload');
    if (typeof payload === 'object') payload = JSON.stringify(payload);
    const result = await this.ipfsService.add(payload);
    console.log('[IPFS] Published ', result.path);
    return result.path;
  }

  async retrieve(cid) {
    console.log('[IPFS] Retrieving ', cid);
    for await (const file of this.ipfsService.get(cid)) {
      if (!file.content) continue;
      const chunks = [];
      for await (const chunk of file.content) chunks.push(chunk);
      return uint8ArrayToString(uint8ArrayConcat(chunks));
    }
  }
}

module.exports = { OffChainStorage };
