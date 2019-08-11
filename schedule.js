const schedule = require('node-schedule');

const timeZoneOffset = {
  ET: {
    offset: 3,
    name: "Eastern time",
    abbreviation: 'ET',
  },
  CT: {
    offset: 2,
    name: "Central time",
    abbreviation: 'CT',
  },
  MT: {
    offset: 1,
    name: "Mountain time",
    abbreviation: 'MT',
  },
  PT: {
    offset: 0,
    name: "Pacific time",
    abbreviation: 'PT',
  },
}
const dayMap = new Map([
  ['Sun', 0],
  ['Mon', 1],
  ['Tue', 2],
  ['Wed', 3],
  ['Thu', 4],
  ['Fri', 5],
  ['Sat', 6],
]);
const timeZoneMap = new Map([
  [timeZoneOffset.ET.abbreviation, timeZoneOffset.ET],
  [timeZoneOffset.CT.abbreviation, timeZoneOffset.CT],
  [timeZoneOffset.MT.abbreviation, timeZoneOffset.MT],
  [timeZoneOffset.PT.abbreviation, timeZoneOffset.PT],
])
const userToTimeZone = new Map();
const SPLIT_TIME_REGEX = /^[0-9]?[0-9]:[0-9][0-9]/i;
const NUMBER_REGEX = /^[0-9]$/i
const AMPM_REGEX = /^[0-9]?[0-9]:[0-9][0-9](A|P)M/i;
let scheduledJob;
let eventInfo;

// This is a doozy.
// nameOfEvent Mon 5:30({A|P}M) (ET) For specific day
// nameOfEvent 5:30({A|P}M) (ET) For today
// If AM/PM left out, check if AM version already passed but can run in PM.
// Time zone is optional if user has already set their personal time zone.
const eventCommand = function(msg, commandArgs) {
  if (eventInfo) {
    msg.reply(
        `We already have event, ${eventInfo.name}.\n`
        + 'Either delete the event with `!remove` or reschedule the event '
        + 'with `!reschedule time`');
    return;
  }
  if (commandArgs.length < 3) {
    replyWithExampleUsage(msg);
    return;
  }
  eventInfo = getEventInfo(msg, commandArgs, /* isReschedule= */ false);
  if (!eventInfo) {
    replyWithExampleUsage(msg);
    return;
  }
  scheduledJob = 
      schedule.scheduleJob(
          `${eventInfo.min} ${eventInfo.hour} * * ${dayMap.get(eventInfo.day)}`,
          function() {
            msg.channel.send(`${eventInfo.name} is happening now.`);
            eventInfo = null;
            scheduledJob = null;
          });
  if (!scheduledJob) {
    eventInfo = null;
    replyWithExampleUsage(msg);
    return;
  }
  msg.channel.send(
    `Scheduled event, ${eventInfo.name}, on ${eventInfo.day} at `
    + `${eventInfo.hour}:${eventInfo.min} PT`);
}

const reminderCommand = function(msg, commandArgs) {
  if (!scheduledJob) {
    msg.reply('No event has been scheduled');
    return;
  }
  msg.channel.send(
      `We have an upcoming event: ${eventInfo.name} on ${eventInfo.day} at `
      + `${eventInfo.hour}:${eventInfo.min} PT`)
}

const removeEventCommand = function(msg, commandArgs) {
  if (!scheduledJob) {
    msg.reply('No event has been scheduled');
    return;
  }
  scheduledJob.cancel();
  scheduledJob = null;
  msg.channel.send(`The event, ${eventInfo.name}, has been cancelled`);
  eventInfo = null;
}

const rescheduleEventCommand = function(msg, commandArgs) {
  if (!scheduledJob) {
    msg.reply('No event has been scheduled');
    return;
  }
  name = eventInfo.name;
  eventInfo = getEventInfo(msg, commandArgs, /* isReschedule= */ true);
  if (!eventInfo) {
    msg.reply('Unable to reschedule. Example usage: `!reschedule Mon 5:30pm PT`');
    return;
  }
  eventInfo.name = name;
  scheduledJob.reschedule(`${eventInfo.min} ${eventInfo.hour} * * ${dayMap.get(eventInfo.day)}`);
  msg.channel.send(
    `Rescheduled event, ${name}, on ${eventInfo.day} at `
    + `${eventInfo.hour}:${eventInfo.min} PT`);
}

const setTimeZoneCommand = function(msg, commandArgs) {
  if (commandArgs.length != 2) {
    msg.reply(
        'Setting time zone requires 2 arguments: `!timezone {ET|CT|MT|PT}`');
    return;
  }
  let offset = getTimeZoneOffset(commandArgs[1]);
  if (!offset) {
    msg.reply('Sorry, I am dumb and can only take ET, CT, MT, PT');
    return;
  }
  userToTimeZone.set(msg.author, offset);
  msg.reply(`done. Your time zone is set to ${offset.name}.`);
}

function getEventInfo(msg, commandArgs, isReschedule) {
  let eventName = isReschedule ? null : commandArgs[1];
  let hourMinIdx = isReschedule ? 2 : 3;
  let timeZoneIdx = isReschedule ? 3 : 4;
  let dayIdx = isReschedule ? 1 : 2;
  let day;
  let isDayInPT = false;
  let potentialDayText = commandArgs[dayIdx].charAt(0).toUpperCase() + commandArgs[dayIdx].slice(1);
  if (dayMap.has(potentialDayText)) {
    day = dayMap.get(potentialDayText);
  } else {
    isDayInPT = true;
    let date = new Date();
    day = date.getDay();
    hourMinIdx--;
    timeZoneIdx--;
  }
  timeZone = getTimeZoneOffset(commandArgs[timeZoneIdx]);
  if (!timeZone) {
    timeZone = userToTimeZone.get(msg.author);
    if (!timeZone) {
      console.log('no time zone found');
      return null;
    }
  }
  let hourMin = getHourMin(day, commandArgs[hourMinIdx]);
  if (!hourMin) {
    console.log('Could not parse hour min');  
    return null;
  }
  let offsetHour = parseInt(hourMin.hour) - parseInt(timeZone.offset);
  console.log(`hour ${hourMin.hour}, min ${hourMin.min}`);
  console.log(`offset: ${timeZone.offset}, offsetHour: ${offsetHour}`);
  if (offsetHour >= 0) {
    hourMin.hour = offsetHour;
  } else {
    if (!isDayInPT) {
      day = (parseInt(day) - 1 + 7) % 7;
    }
    hourMin.hour = (offsetHour + 24);
  }
  if (isPastTime(day, hourMin)) {
    if (hourMin.hour > 12) {
      console.log('Date already passed');
      return null;
    }
    hourMin.hour = parseInt(hourMin.hour) + 12;

    if (isPastTime(day, hourMin)) {
      console.log('Date has already passed');
      return null;
    }
  }
  return {
    name: eventName,
    day: getKeyByValue(dayMap, day),
    hour: hourMin.hour,
    min: hourMin.min,
  }
}

// [hour, min] adds +12 to hour if necessary for military time.
function getHourMin(day, text) {
  console.log(`Parsing hour and minute: ${text}`);
  let parsed = text.match(SPLIT_TIME_REGEX);
  if (!parsed) {
    console.log('Did not match any hour minute supported formats');
    return null;
  }
  parsed = parsed[0];
  let hourMin = parsed.split(':');
  let ampm = text.match(AMPM_REGEX);
  if (ampm) {
    if (ampm[0].slice(-2).toLowerCase() === 'pm') {
      if (hourMin[0] < 12) {
        hourMin[0] = parseInt(hourMin[0]) + parseInt(12);
      }
    } else {
      if (hourMin[0] > 13) {
        return null;
      }
    }
  }
  if (hourMin[0] > 23 || hourMin[1] > 59) {
    console.log('Time formatted incorrectly');
    return null;
  }
  return {
    hour: hourMin[0],
    min: hourMin[1],
  };
}

function isPastTime(day, hourMin) {
  let today = new Date();
  if (today.getDay() !== day) {
    // We can ignore if the days don't match cause we'll schedule it
    // for next week.
    console.log('Not the same day');
    return false;
  }
  if (today.getHours() < hourMin.hour) {
    console.log('requested hour is later');
    return false;
  }
  console.log(`today min: ${today.getMinutes()} requested: ${hourMin.min}`);
  return today.getMinutes() >= hourMin.min;
}

function getTimeZoneOffset(text) {
  if (!text) {
    return null;
  }
  let offset = timeZoneMap.get(text.toUpperCase());
  if (!offset) {
    return null;
  }
  return offset;
}

function replyWithExampleUsage(msg) {
  msg.reply(
      'Sorry, could not schedule event\n'
      + 'Example usage: `!event someEvent Mon 5:30pm PT`');
}

function getKeyByValue(map, searchValue) {
  for (let [key, value] of map.entries()) {
    if (searchValue === value) {
      return key;
    }
  }
}

module.exports = {
  event: eventCommand,
  reminder: reminderCommand,
  remove: removeEventCommand,
  reschedule: rescheduleEventCommand,
  timeZone: setTimeZoneCommand,
}