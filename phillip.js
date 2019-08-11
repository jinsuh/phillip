require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const commands = require('./commands.js');

const nameForChannel = new Map();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  filterChannels(client.channels);
});

client.on('message', msg => {
  let args = msg.content.split(' ');
  let command = commands.getCommand(msg, args);
  if (!command) {
    return;
  }
  if (!isCommandAllowedInChannel(command, msg.channel)) {
    console.log('Command not allowed in channel');
    msg.reply('Command not allowed in this channel');
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
