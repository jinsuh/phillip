require('dotenv').config();
const request = require('request');
const schedule = require('./schedule.js');

const ALPHA_KEY = process.env.STOCK_API;

const getCommand = function(msg, commandArgs) {
  let commandText = commandArgs[0];
  if (commandArgs.length <= 0 || !commandMap.has(commandText)) {
    return null;
  }
  return commandMap.get(commandText);
}

const testCommand = function(msg, commandArgs) {
  msg.channel.send(`hello ${msg.author}`);
}

const listCommand = function(msg, commandArgs) {
  msg.channel.send(
      `Here are the commands:\n`
      + Array.from(commandMap.keys()).join('\n'));
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

const commandType = {
  COMMANDS: {
    availableChannels: new Set([]),
    runCommand: listCommand,
  },
  TEST: {
    availableChannels: new Set([]),
    runCommand: testCommand,
  },
  STOCK: {
    availableChannels: new Set([
      'stocks-investments',
    ]),
    runCommand: stockCommand,
  },
  EVENT: {
    availableChannels: new Set([]),
    runCommand: schedule.event,
  },
  REMOVE: {
    availableChannels: new Set([]),
    runCommand: schedule.remove,
  },
  RESCHEDULE: {
    availableChannels: new Set([]),
    runCommand: schedule.reschedule,
  },
  TIMEZONE: {
    availableChannels: new Set([]),
    runCommand: schedule.timeZone,
  }
}
const commandMap = 
    new Map([
        ['!help', commandType.COMMANDS],
        ['!test', commandType.TEST],
        ['!stock', commandType.STOCK],
        ['!event', commandType.EVENT],
        ['!remove', commandType.REMOVE],
        ['!reschedule', commandType.RESCHEDULE],
        ['!timezone', commandType.TIMEZONE],
      ]);

module.exports = {
  getCommand: getCommand,
}