const Discord = require('discord.js');
const client = new Discord.Client();
var common = require('./common.js');
const print = common.print;
//const prefix = common.prefix();
//const cfg = common.getConfig();
var colors = require('colors');
//var commands = require('./commands.js');

var ext = require('./ext.js');

var cfg = new common.ConfigManager();
const prefix = cfg.get('prefix', '$');
const token = cfg.get('token');

var cman = new ext.CommandManager(prefix);
process.on('unhandledRejection', error => console.error('Uncaught Promise Rejection', error));

client.on('ready', () => {
	print("Running Node ".rainbow+process.version.rainbow, tag="info");
	print(`Logged in as ${client.user.tag}!`, tag="info");
	print("Loaded prefix: `"+prefix+"`", tag="info");
	print("Generic test.");
	print("Info test.", tag="info");
	print("Warn test.", tag="warn");
	print("Say test.", tag="say");
	
	cman.reload_ext();
	client.user.setActivity("Node "+process.version);
})
.on('message', async msg => {
	//console.log(msg.member.voice);
	print(" [ "+msg.channel.name+" : "+msg.guild.name+" ] "+msg.author.tag+": "+msg.content, tag="say");
	cman.process_commands(client, cfg, msg);
})
.on('disconnect', () => { console.warn('Disconnected!'); })
.on('reconnecting', () => { console.warn('Reconnecting...'); })
.on('error', console.error)
.on('warn', console.warn)
.login(token);
