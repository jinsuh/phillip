require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const commands = require('./commands.js');

const nameForChannel = new Map();
const commandType = {
  TEST: {
    availableChannels: new Set([]),
    runCommand: commands.test,
  },
  STOCK: {
    availableChannels: new Set([
      'stocks-investments',
    ]),
    runCommand: commands.stock,
  },
  EVENT: {
    availableChannels: new Set([]),
    runCommand: commands.event,
  },
  REMOVE: {
    availableChannels: new Set([]),
    runCommand: commands.remove,
  },
  RESCHEDULE: {
    availableChannels: new Set([]),
    runCommand: commands.reschedule,
  }
}
const commandMap = 
    new Map([
        ['!test', commandType.TEST],
        ['!stock', commandType.STOCK],
        ['!event', commandType.EVENT],
        ['!remove', commandType.REMOVE],
        ['!reschedule', commandType.RESCHEDULE]]);

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  filterChannels(client.channels);
});

client.on('message', msg => {
  let args = msg.content.split(' ');
  console.log(`args: ${args}`);
  let commandText = args[0];
  if (args.length <= 0 || !commandMap.has(commandText)) {
    return;
  }
  let command = commandMap.get(commandText);
  if (!isCommandAllowedInChannel(command, msg.channel)) {
    console.log('Command not allowed in channel');
    return;
  }
  command.runCommand(msg, args);
});

function filterChannels(channels) {
  this.channels = channels;
  channels.forEach(parseChannel);
}

function parseChannel(value, key, map) {
  nameForChannel.set(key, value.name);
  console.log(`m[${key}] = ${value.name}`);
}

function isCommandAllowedInChannel(commandType, channel) {
  channelName = nameForChannel.get(channel.id);
  availableChannels = commandType.availableChannels;
  console.log(`checking command in channel: ${channelName}`);
  return availableChannels.size === 0
      || availableChannels.has(channelName);
}

client.login(process.env.BOT_TOKEN);
