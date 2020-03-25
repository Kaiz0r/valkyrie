const fs = require('fs');
var common = require('./common.js');

/*
 == FRAMEWORK ==
grouping for commands
used for the help listing, which should just by group
*/

function nocache(module) {
	require("fs").watchFile(require("path").resolve(module), () => {delete require.cache[require.resolve(module)];});
}

function Command(data){
	this.name = data.name;
	this.execute = data.execute;
	this.help = data.help;
	if (data.brief != undefined){this.brief = data.brief;}else if (this.help != undefined){this.brief = this.help.split("\n")[0];
																						  }else{this.brief = "";}
	if (data.usage != undefined){this.usage = data.usage;}
	
	this.group = data.group;
	if (data.aliases != undefined){this.aliases = data.aliases;}else{this.aliases = [];}

	if (data.flags != undefined){this.flags = data.flags;}else{this.flags = [];}
}

exports.CommandManager = function(prefix){
	this.commands = {};
	this.aliasMap = {};
	if (prefix == undefined){this.prefix = ".";}else{this.prefix = prefix;}
};

function Ctx(cman, client, message, cfg) {
	this.message = message;
	this.client = client;
	this.channel = message.channel;
	this.guild = message.guild;
	this.member = message.member;
	this.author = message.author;
	this.vm = vm;
	this.cfg = cfg;
	this.reply = message.reply;
	this.commands = cman;
}

function VoiceManager(){};
var vm = new VoiceManager();

function Voice(ctx){
	this.playlist = [];
	this.vc = ctx.guild.me.voice;
	this.currently_playing = "";
	this.connection = null;
	this.dispatcher = null;
}

VoiceManager.prototype.getClient = async function(ctx){
	if (this[ctx.guild.id] == undefined) {
		this[ctx.guild.id] = new Voice(ctx);
	}
	return this[ctx.guild.id];
};

VoiceManager.prototype.cleanup = async function(ctx){
	if (this[ctx.guild.id] != undefined) {
		delete this[ctx.guild.id];
	}
};

Ctx.prototype.voiceClient = async function(){
	var vc = await vm.getClient(this);
	return vc;
};

Ctx.prototype.connect_voice = async function(){
	var n = vm.getClient(this);
	//if (this.guild.me.voice.channel && this.member.voice.chanel) {
	if (!n.connection){
		console.log("Getting connection");
		return await this.member.voice.channel.join();
	}
	return null;
};

Ctx.prototype.cleanup_voice = async function(input, title){
	if (this.guild.me.voice.channel) {
		await this.guild.me.voice.channel.leave();
	}
	vm.cleanup(this);
};

Ctx.prototype.play = async function(data){
	//var vc = await vm.getClient(this);
	var vc = await vm.getClient(this);

	const title = data.title;
	const input = data.stream;
	
	if (vc && vc.currently_playing){
		this.channel.send(`Adding ${title} to playlist..`);
		vc.playlist.push(data);
		return;
	}

	vc.connection = await this.connect_voice();

	vc.dispatcher = vc.connection.play(input);
	
	vc.dispatcher.on('start', () => {
		this.channel.send(`${title} is now playing!`);
		vc.currently_playing = title;
	});

	vc.dispatcher.on('finish', () => {
		vc.currently_playing = "";
		if (vc.playlist.length > 0){
			const next = vc.playlist.shift();
			this.play(next);
		}else{
			this.channel.send('audio has finished playing!');
			vm.cleanup(this);
		}
	});
	
	vc.dispatcher.on('quit', () => {
		vc.currently_playing = "";
		this.channel.send('audio has finished playing!');
		vm.cleanup(this);
		vc.dispatcher.destroy();

	});
	
	vc.dispatcher.on('error', console.error);
};

Ctx.prototype.getGuildChannel = function( name){
	for (const chan of this.guild.channels.cache){
		const u = chan[1];
		if (u.name == name || u.id == name){
			return u;
		}
	}
	return undefined;
};

Ctx.prototype.getChannel = function(name){
	for (const chan of this.client.channels.cache){
		const u = chan[1];
		if (u.name == name || u.id == name){
			return u;
		}
	}
	return undefined;
};

Ctx.prototype.getMember = function(name){
	for (const user of this.guild.members.cache){
		const u = user[1];
		if (u.nickname == name || u.id == name){
			return u;
		}
	}
	return undefined;
};

Ctx.prototype.findMember = function(name){
	for (const user of this.guild.members.cache){
		const u = user[1];
		if ((u.nickname && u.nickname.toLowerCase().includes(name.toLowerCase())) || u.nickname == name || u.user.username.toLowerCase().includes(name.toLowerCase()) || u.user.username == name || u.id == name){
			return u;
		}
	}
	return undefined;
};

Ctx.prototype.getUser = function(name){
	for (const user of this.client.users.cache){
		const u = user[1];
		if (u.username == name || u.id == name){
			return u;
		}
	}
	return undefined;
};

exports.CommandManager.prototype.process_commands = function(client, cfg, msg){
	if (msg.content.startsWith(this.prefix)){
		var cmd = msg.content.replace(this.prefix, "");
		var args = cmd.split(" ");
		var command = args.shift();
		var ctx = new Ctx(this, client, msg, cfg);
		try {
			this.run(command, ctx, args);
		}catch(err){
			msg.channel.send(common.wrap(err));	
		}

	}
};

exports.CommandManager.prototype.reload_ext = function(target){
	if (target != undefined){
		nocache(`./ext/${target}`);
		var count = 0;
		const command = require(`./ext/${target}`);
		for (const c of Object.keys(command)){
			this.addCommand(c, command[c]);
			count += 1;
		}
		return count;
		
	}else{
		this.commands = {};
		this.aliasMap = {};

		const commandFiles = fs.readdirSync('./ext').filter(file => file.endsWith('.js'));

		for (const file of commandFiles) {
			nocache(`./ext/${file}`);
			const command = require(`./ext/${file}`);
			for (const c of Object.keys(command)){
				this.addCommand(c, command[c]);
			}
		}
		return commandFiles;
	}
};

exports.CommandManager.prototype.asList = function(){
	return Object.keys(this.commands);
};

exports.CommandManager.prototype.addCommand = function(name, data){
	data.name = name;
	this.commands[name] = new Command(data);
	const aliases = this.commands[name].aliases;
	for (i=0;i<aliases.length;i++){
		this.aliasMap[aliases[i]] = name;
	}
};

exports.CommandManager.prototype.set = function(name, key, val){
	this.commands[name][key] = val;
};

exports.CommandManager.prototype.setHelp = function(name, help){
	this.commands[name].help = help;
};

exports.CommandManager.prototype.setGroup = function(name, group){
	this.commands[name].group = group;
};

exports.CommandManager.prototype.setAliases = function(name, aliases){
	for (i=0;i<aliases.length;i++){
		this.commands[name].aliases.push(aliases[i]);
		this.aliasMap[aliases[i]] = name;
	}
};

exports.CommandManager.prototype.getCommand = function(name){
	return this.commands[name];
};

exports.CommandManager.prototype.run = function(name, ctx, args){
	if (this.commands[name] != undefined){
		this.commands[name].execute(ctx, args);
	}else if (this.aliasMap[name] != undefined){
		this.run(this.aliasMap[name], ctx, args);
	}
};
