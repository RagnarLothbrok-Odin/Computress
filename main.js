import chalk from 'chalk';
import net from 'net';
import { Client, GatewayIntentBits, ActivityType } from 'discord.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const { token, prefix, serverName } = require('./config.json');

let online = false;
let population = 0;

const debug = false;

// Create client
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const chan = 'computress';

// Ready event
client.on('ready', () => {
  console.log(`${chalk.whiteBright('Logged in as')} ${chalk.red.bold.underline(`${client.user.tag}`)}`);
  refreshStatus();
});

client.on('messageCreate', (msg) => {
  if (msg.content.toLowerCase() === `${prefix}status` || msg.content.toLowerCase() === `${prefix}up`) {
    if (online) {
      msg.channel.send(`${serverName}, is currently **online** ✅ with **${population}** player${population === 1 ? 's' : ''}`);
    } else {
      msg.channel.send(`${serverName}, is currently **offline** ⛔`);
    }
  }
});

if (!debug) client.login(token);

// Socket
let ip = process.argv.length > 2 ? process.argv[2] : '127.0.0.1';
if (!ip.includes(':')) ip += ':8003';

let buffer = [];

const options = {
  port: ip.split(':')[1],
  host: ip.split(':')[0],
};

console.log(`${chalk.red(['INFO'])} ${chalk.whiteBright(`Connecting to monitor at ${ip}...`)}`);

let socket = net.connect(options, () => {
  console.log(`${chalk.red(['INFO'])} ${chalk.whiteBright('Connected.')}`);
  online = true;
});

socket.on('data', onDat);
socket.on('error', onErr);
socket.on('end', onEnd);

function refreshStatus() {
  if (!online) {
    client.user.setActivity(
      `${population} players`,
      {
        type: ActivityType.Watching,
      },
    );
  } else {
    client.user.setActivity(
      '0 players',
      {
        type: ActivityType.Watching,
      },
    );
  }
}

function onErr() {
  online = false;
  setTimeout(attemptReconnect, 10000);
}

function onDat(data) {
  const tokens = data.toString().split('\n');
  tokens.forEach((e) => {
    if (e.length > 0) buffer.push(e);
  });

  if (buffer.includes('end')) {
    processBuffer();
  }
}

function onEnd() {
  console.log(`${chalk.red('[WARN]')} Lost connection to monitor.`);
  online = false;
  setTimeout(attemptReconnect, 10000);
}

function attemptReconnect() {
  console.log(`${chalk.whiteBright('Attempting to reconnect...')}`);
  if (!debug) refreshStatus();
  socket = net.connect(options, () => {
    console.log(`${chalk.whiteBright('Reconnected')}`);
    online = true;
  });
  socket.on('error', onErr);
  socket.on('data', onDat);
  socket.on('end', onEnd);
}

function printBuffer(buf) {
  console.log('{');
  for (let i = 0; i < buf.length; i++) {
    console.log(buf[i]);
  }
  console.log('}');
}

function processBuffer() {
  if (debug) printBuffer(buffer);
  if (buffer.includes('begin')) {
    const queue = buffer.slice(buffer.indexOf('begin') + 1, buffer.indexOf('end'));
    population = 0;
    for (let i = 0; i < queue.length; i++) {
      const tokens = queue[i].split(' ');
      const head = queue[i].substring(queue[i].indexOf(' ') + 1);
      let body = '\n```\n';
      switch (tokens[0]) {
        case 'player':
          population++;
          break;
        case 'chat':
          if (!debug) client.channels.cache.find((ch) => ch.name === chan).send(queue[i].substring(queue[i].indexOf(' ') + 1));
          break;
        case 'email':
          for (let j = 1; queue[i + j][0] === '\t'; j++) { body += `${queue[i + j].substring(1)}\n`; }
          body += '```';
          if (!debug) client.channels.cache.find((ch) => ch.name === chan).send(head + body);
          if (!queue[i + j].includes('endemail')) console.log(`${chalk.red('[WARN]')} ${chalk.whiteBright('Bad email (no endemail)')}`);
          i += j;
          break;
        default:
          console.log(`${chalk.red('[WARN]')} ${chalk.whiteBright(`Unknown token: ${tokens[0]}`)}`);
          break;
      }
    }
    if (!debug) refreshStatus();
  } else {
    console.log(`${chalk.red('[WARN]')} ${chalk.whiteBright('Bad data (no begin); ignoring')}`);
  }
  buffer = buffer.slice(buffer.indexOf('end') + 1, buffer.length);
}
