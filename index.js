const https = require('https');
const { DANEAgent, setServers, lookup, dns } = require('https-dane');

function fetchAddress(alias, token = 'HNS') {
  return new Promise((resolve, reject) => {
    const agent = new DANEAgent();
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
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 400) {
          const error = new Error(res.statusMessage);
          error.code = res.statusCode;
          return reject(error);
        }

        resolve(data);
      });
    });
    req.on('error', (error) => reject(error));
    req.end();
  });
}

module.exports = { fetchAddress, setServers, lookup, DANEAgent, dns };
