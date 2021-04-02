const ipfsAPI = require('ipfs-http-client');
const uint8ArrayConcat = require('uint8arrays/concat');
const uint8ArrayToString = require('uint8arrays/to-string');

class OffChainStorage {
  constructor() {
    this.ipfsService = ipfsAPI({
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https',
    });
  }

  async publish(payload) {
    if (typeof payload === 'object') payload = JSON.stringify(payload);
    const result = await this.ipfsService.add(payload);
    return result.path;
  }

  async retrieve(cid) {
    for await (const file of this.ipfsService.get(cid)) {
      if (!file.content) continue;
      const chunks = [];
      for await (const chunk of file.content) chunks.push(chunk);
      return uint8ArrayToString(uint8ArrayConcat(chunks));
    }
  }
}

module.exports = { OffChainStorage };
