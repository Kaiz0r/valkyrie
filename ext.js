const fs = require('fs');
var common = require('./common.js');
const moment = require('moment');
const ytdl = require('ytdl-core-discord');

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

exports.ExtManager = function(client, prefix){
	this.client = client;
	this.commands = {};
	this.aliasMap = {};

	this.threads = {};
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
	this.ext = cman;

	this.args = this.message.content.split(" ");
	this.args.shift();
	this.argsRaw = this.args.join(" ");
}

Ctx.prototype.invoke = async function(command){
	await this.commands.run(command, this);
};

Ctx.prototype.clone = async function(){
	var ctx = new Ctx(this.commands, this.client, this.msg, this.cfg);
	return ctx;
};

Ctx.prototype.newCtx = async function(msg){
	var ctx = new Ctx(this.commands, this.client, msg, this.cfg);
	return ctx;
};

exports.rand = function(intn) { return Math.floor((Math.random() * intn) + 1); };


function VoiceManager(){};
var vm = new VoiceManager();

function Voice(ctx){
	this.playlist = [];
	this.vc = ctx.guild.me.voice;
	this.currently_playing = "";
	this.connection = null;
	this.dispatcher = null;
	this.owner = null;
}

VoiceManager.prototype.getClient = async function(ctx){
	if (this[ctx.guild.id] == undefined) {
		this[ctx.guild.id] = new Voice(ctx);
	}
	return this[ctx.guild.id];
};

VoiceManager.prototype.getClientSync = function(ctx){
	if (this[ctx.guild.id] == undefined) {
		this[ctx.guild.id] = new Voice(ctx);
	}
	return this[ctx.guild.id];
};

VoiceManager.prototype.hasClient = function(ctx){
	if (this[ctx.guild.id] == undefined) {
		return false;
	}
	return true;
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

Ctx.prototype.setVCLock = async function(user){
	var vc = await vm.getClient(this);
	if (!vm.hasClient) return 3;
	
	if (vc.owner){
		if(vc.owner != user.id){
			console.log(vc.owner);
			return 2;
		}
		vc.owner = null;
		console.log(vc.owner);
		return 0;
	}
	vc.owner = user.id;
	console.log(vc.owner);
	return 1;
};

Ctx.prototype.getVCLock = function(){
	var vc = vm.getClientSync(this);
	if(!vm.hasClient(this)) return false;
	console.log((vc.owner && this.member.id == vc.owner));
	if (!vc.owner) return true;
	if (this.member.id == vc.owner) return true;
	return false;
};

Ctx.prototype.play = async function(data){
	//var vc = await vm.getClient(this);
	var vc = await vm.getClient(this);
	/*if (vc.owner != undefined && data.user.id != vc.owner){
		this.channel.send("You do not have permission to do that.");
		return;
	}*/
	let title = data.title;
	const input = data.stream;
	
	if (vc && vc.currently_playing){
		this.channel.send(`Adding ${title} (${data.lengthParsed}) to playlist..`);
		vc.playlist.push(data);
		return;
	}

	vc.connection = await this.connect_voice();

	if (data.watchPage)
		vc.dispatcher = vc.connection.play(await ytdl(data.watchPage), { type: 'opus' });
	else
		vc.dispatcher = vc.connection.play(data.stream);
	
	vc.dispatcher.on('start', () => {
		let name = "";
		if (data.user.nickname != undefined){name = data.user.nickname;}else{name = data.user.user.username;}

		const cleanSongTitle = function(ctx, title){
			var mcfg = ctx.cfg.get("audio_search_clean", []);
			let out = title;
			for (const filt of mcfg){
				out = out.replace(filt, '');
			}
			//out = out.replace('[HQ]', '');
			//out = out.replace('[HD]', '');
			//out = out.replace('lyrics', '');
			return out;
		};
		title = cleanSongTitle(this, title);
		this.channel.send(`${title} (${data.lengthParsed}) by ${name} is now playing!`);
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

Ctx.prototype.say = function(msg){
	this.channel.send(msg);
};

Ctx.prototype.send = function(msg){
	this.channel.send(msg);
};

Ctx.prototype.code = function(msg, code){
	this.channel.send(`\`\`\`${code}\n${msg}\n\`\`\``);
};

//Ctx.prototype.sendEmbed = function(msg){
	//this.channel.send(msg);
//};

Ctx.prototype.getGuildChannel = function(name){
	for (const chan of this.guild.channels.cache){
		const u = chan[1];
		if (u.name == name || u.id == name){
			return u;
		}
	}
	return undefined;
};

Ctx.prototype.findGuildChannel = function(name){
	for (const chan of this.guild.channels.cache){
		const u = chan[1];
		if (u.name.lower().includes(name.lower()) || u.name.lower() == name.lower() || u.id == name){
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

Ctx.prototype.findChannel = function(name){
	for (const chan of this.client.channels.cache){
		const u = chan[1];
		if (u.name.lower().includes(name.lower()) || u.name.lower() == name.lower() || u.id == name){
			return u;
		}
	}
	return undefined;
};

Ctx.prototype.getGuild = function(name){
	for (const guild of this.client.guilds.cache){
		const u = guild[1];
		if (u.name == name || u.id == name){
			return u;
		}
	}
	return undefined;
};

Ctx.prototype.findGuild = function(name){
	for (const guild of this.client.guilds.cache){
		const u = guild[1];
		if (u.name.lower().includes(name.lower()) || u.name.lower() == name.lower() || u.id == name){
			return u;
		}
	}
	return undefined;
};

Ctx.prototype.getRole = function(name){
	for (const role of this.guild.roles.cache){
		const u = role[1];
		if (u.name == name || u.id == name){
			return u;
		}
	}
	return undefined;
};

Ctx.prototype.findRole = function(name){
	for (const role of this.guild.roles.cache){
		const u = role[1];
		if (u.name.lower().includes(name.lower()) || u.name.lower() == name.lower() || u.id == name){
			return u;
		}
	}
	return undefined;
};

Ctx.prototype.getMember = function(name){
	for (const user of this.guild.members.cache){
		const u = user[1];
		if (u.nickname == name || u.id == name || u.user.username == name){
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

Ctx.prototype.getUser = function(name){
	for (const user of this.client.users.cache){
		const u = user[1];
		if (u.username.lower().includes(name.lower()) ||u.username.lower() == name.lower() || u.id == name){
			return u;
		}
	}
	return undefined;
};

exports.ExtManager.prototype.process_commands = function(client, cfg, msg){
	if (msg.content.startsWith(this.prefix)){
		var cmd = msg.content.replace(this.prefix, "");
		var args = cmd.split(" ");
		var command = args.shift();
		var ctx = new Ctx(this, client, msg, cfg);
		try {
			this.run(command, ctx);
		}catch(err){
			msg.channel.send(common.wrap(err));	
		}

	}
};

exports.ExtManager.prototype.reload_ext = function(target){
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

exports.ExtManager.prototype.reload_threads = function(target){
	if (target != undefined){
		nocache(`./threads/${target}`);
		var count = 0;
		const command = require(`./threads/${target}`);
		for (const c of Object.keys(command)){
			this.addThread(c, command[c]);
			count += 1;
		}
		return count;
		
	}else{
		const commandFiles = fs.readdirSync('./threads').filter(file => file.endsWith('.js'));
		this.threads = {};
		for (const file of commandFiles) {
			nocache(`./threads/${file}`);
			const command = require(`./threads/${file}`);
			for (const c of Object.keys(command)){
				this.addThread(c, command[c]);
			}
		}
		return commandFiles;
	}
};

exports.ExtManager.prototype.asList = function(){
	return Object.keys(this.commands);
};

exports.ExtManager.prototype.addCommand = function(name, data){
	if(data.auto != undefined) data.auto(this.client);
	
	if(data.execute == undefined)return;
	data.name = name;
	this.commands[name] = new Command(data);
	const aliases = this.commands[name].aliases;
	for (i=0;i<aliases.length;i++){
		this.aliasMap[aliases[i]] = name;
	}
};

exports.ExtManager.prototype.addThread = function(name, data){
	if(this.client._config.get('halted_threads').includes(name)) return;
	
	let interval = 1000;
	if (data.interval != undefined){interval = data.interval;}
	let thr = this.client.setInterval(data.loop, interval, {client: this.client});
	this.threads[name] = thr;
	
};

exports.ExtManager.prototype.stopThread = function(name){
	this.client.clearInterval(this.threads[name]);
};

exports.ExtManager.prototype.set = function(name, key, val){
	this.commands[name][key] = val;
};

exports.ExtManager.prototype.setHelp = function(name, help){
	this.commands[name].help = help;
};

exports.ExtManager.prototype.setGroup = function(name, group){
	this.commands[name].group = group;
};

exports.ExtManager.prototype.setAliases = function(name, aliases){
	for (i=0;i<aliases.length;i++){
		this.commands[name].aliases.push(aliases[i]);
		this.aliasMap[aliases[i]] = name;
	}
};

exports.ExtManager.prototype.getCommand = function(name){
	return this.commands[name];
};

exports.ExtManager.prototype.run = async function(name, ctx, args){
	if (this.commands[name] != undefined){
		try {
			await this.commands[name].execute(ctx);
		}catch(err) {ctx.channel.send(common.wrap(err));}
	}else if (this.aliasMap[name] != undefined){
		this.run(this.aliasMap[name], ctx);
	}
};
