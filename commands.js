require('dotenv').config();
const request = require('request');
const schedule = require('./schedule.js');

const ALPHA_KEY = process.env.STOCK_API;

const testCommand = function(msg, commandArgs) {
  msg.channel.send(`hello ${msg.author}`);
}

const stockCommand = function(msg, commandArgs) {
  if (commandArgs.length < 2) {
    msg.channel.send('Need to specify a stock symbol for the query');
    return;
  }
  let stockSymbol = commandArgs[1];
  let options = {
    url: `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${stockSymbol}&apikey=${ALPHA_KEY}`,
    headers: {
      'User-Agent': 'request'
    }
  };
  new Promise((resolve, reject) => {
    request.get(options, function(err, resp, body) {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(body));
      }
    })
  }).then(function(result) {
    let quote = result['Global Quote'];
    if (!Object.keys(quote).length) {
      throw 'No quote available';
    }
    let resultText = 
        `Stock info for ${stockSymbol.toUpperCase()}\n`
        + `Open: ${quote['02. open']}\n`
        + `High: ${quote['03. high']}\n`
        + `Low: ${quote['04. low']}\n`
        + `Price: ${quote['05. price']}\n`
        + `Volume: ${quote['06. volume']}\n`
        + `Change: ${quote['09. change']}\n`
        + `Change percent: ${quote['10. change percent']}\n\n`
        + `For more info: https://finance.yahoo.com/quote/${stockSymbol.toLowerCase()}`;
    msg.channel.send(resultText);
  }).catch(function(err) {
    console.log(err);
    msg.channel.send(`Unable to find stock: ${stockSymbol.toUpperCase()}`);
  });
}

module.exports = {
  test: testCommand,
  stock: stockCommand,
  event: schedule.event,
  remove: schedule.remove,
  reschedule: schedule.reschedule,
}