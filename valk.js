const Discord = require('discord.js');
const client = new Discord.Client();
var common = require('./common.js');
const print = common.print;
// const prefix = common.prefix();
// const cfg = common.getConfig();
var colors = require('colors');
// var commands = require('./commands.js');

var ext = require('./ext.js');
const inspire = require('./inspire.js');

var cfg = new common.ConfigManager();
client._config = cfg;

const prefix = cfg.get('prefix', '$');
const token = cfg.get('token');

var cman = new ext.ExtManager(client, prefix);
process.on('unhandledRejection', (error) => console.error('Uncaught Promise Rejection', error));

client.on('ready', () => {
  print('Running Node '.rainbow+process.version.rainbow, tag='info');
  print(`Logged in as ${client.user.tag}!`, tag='info');
  print('Loaded prefix: `'+prefix+'`', tag='info');
  print('Generic test.');
  print('Info test.', tag='info');
  print('Warn test.', tag='warn');
  print('Say test.', tag='say');

  cman.reload_ext();
  cman.reload_threads();
  client.user.setActivity('Node '+process.version);


  client.inspire = new inspire.Inspire();
  client.inspire.golem.addCommand('!restart', function(g, m) {
    client.inspire = new inspire.Inspire();
    client.inspire.loadDataset('golem_core_dataset.golem');
  });
  // i.golem.output = function(m){console.log(i.name()+"> "+m);};
  client.inspire.loadDataset('golem_core_dataset.golem');
})
    .on('message', async (msg) => {
      if (!msg.author.bot) {
        print(' [ '+msg.channel.name+' : '+msg.guild.name+' ] '+msg.author.tag+': '+msg.content, tag='say');
        cman.process_commands(client, cfg, msg);

        if (client.inspire.golem.flags.autoparse == 'false') return;
        client.inspire.golem.output = function(m) {
          console.log('m '+m); if (m != undefined) msg.react('🤖');
        };
        client.inspire.message(msg.author.username, msg.content);
      }
    })
    .on('voiceStateUpdate', async function(before, after) {
      if (before.channel == null) return;
      if (before.member.id == client.user.id) return;

      if (before.channel.members.array().length == 1) {
        await before.channel.leave();
      }
    })
    .on('presenceUpdate', async function(before, after) {
      if (after.member.guild.id == '396716931962503169') {
        const r = client._config.get('recruit_records');
        const channel = after.member.guild.channels.cache.find((ch) => ch.name === 'botmasters-testzone');
        const recruit = after.member.roles.cache.find((ch) => ch.name === 'recruit');

        if (recruit != undefined && recruit != null) {
          if (!r.includes(after.member.id) && before.status != undefined && before.status == 'offline' && after.status == 'online') {
            channel.send(`monitor: ${after.user.username} has been seen.`);
            r.push(after.id);
            client._config.set('recruit_data', r);
          }
        }
      }
    })
    .on('messageReactionAdd', async function(reaction, user) {
      if (user.bot) return;
      if (reaction.emoji.name == '📱' || reaction.emoji.name == '🤖') {
        client.inspire.golem.output = function(m) {
          reaction.message.reply(m);
        };
        client.inspire.message(reaction.message.author.username, reaction.message.content);
      }
    })
    .on('disconnect', () => {
      console.warn('Disconnected!');
    })
    .on('reconnecting', () => {
      console.warn('Reconnecting...');
    })
    .on('error', console.error)
    .on('warn', console.warn)
    .login(token);
