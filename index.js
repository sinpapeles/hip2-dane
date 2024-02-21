const https = require('https');
const { DANEAgent, setServers, lookup, dns } = require('https-dane');

const defaultOpts = {
  token: 'HNS',
  maxLength: 90,
  validate: (key) => !!key && key.slice(0, 3) === 'hs1' && key.length <= 90, // https://wiki.trezor.io/Bech32
};

function fetchAddress(alias, opts = defaultOpts) {
  const { token, maxLength, validate } = opts || {};
  const agent = new DANEAgent();
  return new Promise((resolve, reject) => {
    if (validate(alias)) {
      const error = new Error('alias cannot be a valid address');
      error.code = 'ECOLLISION';
      return reject(error);
    }

    const url = `https://${alias}/.well-known/wallets/${token.toUpperCase()}`;
    const req = https.get(url, { agent, lookup }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        const newLine = chunk.indexOf('\n');
        if (newLine >= 0) {
          req.destroy();
          chunk = chunk.slice(0, newLine);
        }
        if (data.length + chunk.length > maxLength) {
          if (!req.destroyed) {
            req.destroy();
          }
          const error = new Error('response too large');
          error.code = 'ELARGE';
          return reject(error);
        }
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          const error = new Error(res.statusMessage);
          error.code = res.statusCode;
          return reject(error);
        }

        if (validate && validate(data)) {
          resolve(data);
        } else {
          const error = new Error('invalid address');
          error.code = 'EINVALID';
          reject(error);
        }
      });
    });
    req.on('error', (error) => reject(error));
    req.end();
  });
}

module.exports = { fetchAddress, setServers, lookup, DANEAgent, dns };
