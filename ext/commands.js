var common = require('../common.js');
const print = common.print;
const util = require('util');
const discord = require('discord.js');
const Gamedig = require('gamedig');

const luaState = require('lua-in-js');
const luaEnv = luaState.createEnv();
var needle = require('needle');
const cheerio = require('cheerio');
const checks = require('../checks.js');
/*
 = TODO =


 == COMMANDS == 
run as <member> <command>

run in <channel> <command>

covid

in help, if command has flags for $owner, $admin, $whitelist, run the check on executor to know if it should show
*/

exports.run = {
	help: "Simulate command settings.",
	group: "admin",
	flags: ['$owner'],
	execute: async function(ctx, args) {
		if (!checks.isOwner(ctx)){return;}
		const mode = args.shift();
		const target = args.shift();
		const command = args.shift();
		const cargs = args;

		ctx.channel.send(`Will run \`${command}: ${cargs}\` ${mode} ${target}`);

		if (mode == "as"){
			const m = ctx.findMember(target);
			var n = await ctx.newCtx(ctx.message);
			n.member = m;
			await n.invoke(command, cargs);
		}else if ( mode == "in" ){
			
		}
	}
};

exports.debug = {
	help: "Debugging properties.",
	group: "admin",
	flags: ['$hidden'],
	execute: async function(ctx, args) {
		ctx.channel.send(`${ctx.member}\n${args}`);
	}
};

exports.set = {
	help: "Sets a var.",
	group: "admin",
	flags: ['$owner'],
	usage: "[key] [value]",
	execute: async function(ctx, args) {
		if (!checks.isOwner(ctx)){return;}
		const key = args.shift();
		var value = args.join(" ");

		if (['undefined',  'nil', 'null', 'none'].includes(value)){value = undefined;}
		if (['[]', 'new Array()'].includes(value)){value = [];}
		ctx.cfg.set(key, value);
		ctx.channel.send(`Setting **${key}** to **${value}** (${typeof(value)}).`);
	}
};

exports.get = {
	help: "Gets a var.",
	group: "admin",
	flags: ['$owner'],
	usage: "[key] [value]",
	execute: async function(ctx, args) {
		if (!checks.isOwner(ctx)){return;}
		ctx.reply(ctx.cfg.get(args.join (" ")));
	}
};

exports.whitelist = {
	help: "Manages whitelisted users.",
	group: "admin",
	flags: ['$owner'],
	usage: "[member]",
	execute: async function(ctx, args) {
		var ls = ctx.cfg.get('whitelist', []);
		
		if (args.length == 0){
			if (ls.length > 0){ ctx.channel.send(ls.join(", "));return; }else{ctx.channel.send("None.");return;}
		}
		
		if (!checks.isOwner(ctx)){ctx.channel.send("Access denied.");return;}
		var m = ctx.findMember(args.join(" "));
		if (m == undefined){ctx.channel.send("Member not found."); return;}
		
		if (ls.includes(m.id)){
			ls.splice (ls.indexOf(m.id), 1);
			console.log(ls);
			ctx.cfg.set('whitelist', ls);
			ctx.channel.send(`De-whitelisted ${m}.`);
		}else{
			ls.push(m.id);
			console.log(ls);
			ctx.cfg.set('whitelist', ls);
			ctx.channel.send(`Whitelisted ${m}.`);
		}
	}
};

exports.reload = {
	help: "Reloads extensions",
	group: "admin",
	flags: ['$owner'],
	usage: "[optional: module]",
	execute: async function(ctx, args) {
		if (!checks.isOwner(ctx)){return;}
		if (args.length == 0){
			const out = ctx.commands.reload_ext();
			ctx.channel.send(`Extensions reloaded.\n${out}`);
		}else{
			const out = ctx.commands.reload_ext(args[0]);
			ctx.channel.send(`Extension ${args[0]} reloaded (${out}).`);
		}
	}
};

exports.help = {
	help: "Gets help.",
	flags: ['$hidden'],
	execute: async function(ctx, args) {
		if (args.length != 0){
			const target = ctx.commands.commands[args[0]];
			if (target == undefined){
				ctx.channel.send(`Command ${args[0]} not found.`);
			}else{
				var output = "["+args[0].toUpperCase()+"]";
				
				if (target.group != undefined){output += "\nGroup: "+target.group;}
				
				output += "\nUsage: "+ctx.commands.prefix+args[0].toLowerCase()+" ";
				if (target.usage){output += target.usage;}
				
				if (target.help){output += "\n"+target.help;}

				if (target.flags.length > 0){
					output += "\nFlags: ";
					output += target.flags.join(", ");
				}
				
				ctx.channel.send(common.code(output, 'ini'));
			}
		}else{
			var sorts = {};
			for (const c of ctx.commands.asList()) {
				var cmd = ctx.commands.getCommand(c);
				if (cmd.group == undefined){
					if(!cmd.flags.includes("$hidden")){
						if(sorts["others"] == undefined){sorts["others"] = [];}
						sorts["others"].push(cmd);
					}
				}else{
					if(cmd.group != "#hidden" && !cmd.flags.includes("$hidden")){
						if(sorts[cmd.group] == undefined){sorts[cmd.group] = [];}
						sorts[cmd.group].push(cmd);
					}
				}

			}
			var h = "";

			for (const group of Object.keys(sorts)){
				h += "["+group+"]\n";
				for (const command of sorts[group]){
					h += "  "+command.name+common.space("  "+command.name, 20, command.brief)+"\n";
				}
			}
			ctx.channel.send(common.code(h, 'ini'));
		}
	}
};

exports.inviteme = {
	help: "Creates an invitation",
	group: "bot",
	aliases: ['inv', 'iv'],
	execute: async function(ctx, args) {
		ctx.channel.send("<https://discordapp.com/oauth2/authorize?client_id=507218821673648148&scope=bot>");	
	}
};

exports.gm = {
	help: "Pings a GMOD server.",
	group: "gaming",
	usage: "[ip] [port]",
	aliases: [],
	execute: async function(ctx, args) {
		var host = "185.38.150.28",
			port = "27055";
		
		if (args.length == 2){
			host = args[0];
			port = args[1];
		}
		
		Gamedig.query({
			type: 'garrysmod',
			host: host,
			port: port
		}).then((state) => {
			resp = `**Name**: ${state.name}\n`;
			resp += `**Map**: ${state.map}\n`;
			resp += `**Version**: ${state.raw.version}\n`;
			resp += `**Game**: ${state.raw.game}\n`;
			resp += `**Ping**: ${state.ping}\n`;
			resp += `**Players**: ${state.raw.numplayers}/${state.maxplayers}\n`;
			ctx.channel.send(resp);
		}).catch((error) => {
			ctx.channel.send("Server is offline");
		});	
	}
};

exports.cat = {
	help: " ",
	group: "animals",
	aliases: [],
	execute: async function(ctx, args) {
		const headers = {"x-api-key": "dca2da26-0ed8-406b-a99d-b8e86d165c99"};

		needle.get('https://api.thecatapi.com/v1/images/search', headers, function(error, response) {
			if (!error && response.statusCode == 200)
				ctx.channel.send(response.body[0]['url']);
		});				
	}
};

exports.dog = {
	help: " ",
	group: "animals",
	execute: async function(ctx, args) {
		needle.get('https://random.dog/woof.json', function(error, response) {
			if (!error && response.statusCode == 200)
				ctx.channel.send(response.body.url);
		});
		
	}
};

exports.catfact = {
	help: " ",
	group: "animals",
	execute: async function(ctx, args) {
		needle.get('https://some-random-api.ml/facts/cat', function(error, response) {
			if (!error && response.statusCode == 200)
				ctx.channel.send(response.body.fact);
		});		
	}
};

exports.dogfact = {
	help: " ",
	group: "animals",
	execute: async function(ctx, args) {
		needle.get('https://some-random-api.ml/facts/dog', function(error, response) {
			if (!error && response.statusCode == 200)
				ctx.channel.send(response.body.fact);
		});		
	}
};

exports.lyrics = {
	help: "",
	group: "wip",
	aliases: [],
	execute: async function(ctx, args) {	
	}
};
	
exports.dog2 = {
	help: "",
	group: "animals",
	aliases: [],
	execute: async function(ctx, args) {
		needle.get('https://dog.ceo/api/breeds/image/random', function(error, response) {
			if (!error && response.statusCode == 200)
				ctx.channel.send(response.body.message);
		});
	}
};

exports.bird = {
	help: "",
	group: "animals",
	aliases: [],
	execute: async function(ctx, args) {
		needle.get('http://shibe.online/api/birds?count=1&urls=true', function(error, response) {
			if (!error && response.statusCode == 200)
				ctx.channel.send(response.body[0]);
		});
	}
};

exports.shibe = {
	help: "",
	group: "animals",
	aliases: [],
	execute: async function(ctx, args) {
		needle.get('http://shibe.online/api/shibes?count=1&urls=true', function(error, response) {
			if (!error && response.statusCode == 200)
				ctx.channel.send(response.body[0]);
		});
	}
};

exports.fox = {
	help: "",
	group: "animals",
	aliases: [],
	execute: async function(ctx, args) {
		needle.get('https://randomfox.ca/floof/', function(error, response) {
			if (!error && response.statusCode == 200)
				ctx.channel.send(response.body.image);
		});		
	}
};

exports.bun = {
	help: "",
	group: "animals",
	aliases: [],
	execute: async function(ctx, args) {
		needle.get('https://dotbun.com/', function(error, response) {
			if (!error && response.statusCode == 200){
				let $ = cheerio.load(response.body);
				const image = $('img').get(1);
				const b = $(image).attr('src');
				ctx.channel.send("https://dotbun.com/"+b);
			}
		});
	}
};

exports.pika = {
	group: "meme",
	execute: async function(ctx, args) {
		needle.get('https://some-random-api.ml/pikachuimg', function(error, response) {
			if (!error && response.statusCode == 200)
				ctx.channel.send(response.body.link);
		});		
	}
};

exports.hug = {
	group: "meme",
	execute: async function(ctx, args) {
		needle.get('https://some-random-api.ml/animu/hug', function(error, response) {
			if (!error && response.statusCode == 200)
				ctx.channel.send(response.body.link);
		});
	}
};

exports.pat = {
	group: "meme",
	execute: async function(ctx, args) {
		needle.get('https://some-random-api.ml/animu/pat', function(error, response) {
			if (!error && response.statusCode == 200)
				ctx.channel.send(response.body.link);
		});		
	}
};

exports.wink = {
	group: "meme",
	execute: async function(ctx, args) {
		needle.get('https://some-random-api.ml/animu/wink', function(error, response) {
			if (!error && response.statusCode == 200)
				ctx.channel.send(response.body.link);
		});		
	}
};

exports.duck = {
	group: "animals",
	execute: async function(ctx, args) {
		needle.get('https://random-d.uk/api/quack', function(error, response) {
			if (!error && response.statusCode == 200)
				ctx.channel.send(response.body.url);
		});
	}
};

exports.redpanda = {
	group: "animals",
	execute: async function(ctx, args) {
		needle.get('https://some-random-api.ml/img/red_panda', function(error, response) {
			if (!error && response.statusCode == 200)
				ctx.channel.send(response.body.link);
		});
	}
};

exports.panda = {
	group: "animals",
	execute: async function(ctx, args) {
		needle.get('https://some-random-api.ml/img/panda', function(error, response) {
			if (!error && response.statusCode == 200)
				ctx.channel.send(response.body.link);
		});		
	}
};

exports.lua = {
	help: "Evaluates arbtirary LUA code.",
	group: "utility",
	aliases: [],
	flags: ['$whitelist'],
	usage: ['[code]'],
	execute: async function(ctx, args) {
		if (!checks.isWhitelisted(ctx)){ctx.channel.send("Access denied.");return;}
		args = args.join(" ");
		args = args.replace("```lua", "");
		args = args.replace("```", "");
		
		const luaScript = luaEnv.parse(args);
		
		var intercept = require("intercept-stdout"),
			captured_text = "";

		var unhook_intercept = intercept(function(txt) {
			captured_text += txt;
		});
		
		const returnValue = luaScript.exec();
		
		unhook_intercept();

		if (captured_text == ""){captured_text = "undefined";}

		const em = new discord.MessageEmbed()
			  .setAuthor(ctx.member.nickname, ctx.member.user.avatarURL(), '')
			  .setColor('#0099ff')
			  .setTimestamp()
			  .addFields(
				  { name: 'Captured Text', value: "```"+captured_text+"```" },
				  { name: "Returned", value: "```"+returnValue+"```" },
			  );

		ctx.channel.send(em);
	}
};

exports.js = {
	help: "Evaluates arbtirary javascript code.\nAccess is only given to whitelisted people.",
	brief: "Javascript interpreter.",
	group: "utility",
	aliases: ['eval'],
	flags: ['$whitelist'],
	usage: ['[code]'],
	execute: async function(ctx, args) {
		if (!checks.isWhitelisted(ctx)){ctx.channel.send("Access denied.");return;}
		args = args.join(" ");
		args = args.replace("```js", "");
		args = args.replace("```", "");
		if (args == ""){
			ctx.channel.send("```Requires code to execute.```");
		}else{
			try {
				var intercept = require("intercept-stdout"),
					captured_text = "";
				var unhook_intercept = intercept(function(txt) {
					captured_text += txt;
				});
				let evaled = eval(args);
				if (evaled instanceof Promise) evaled = await evaled;
				unhook_intercept();
				if (captured_text == ""){captured_text = "undefined";}
				const em = new discord.MessageEmbed()
					  .setAuthor(ctx.member.nickname, ctx.member.user.avatarURL(), '')
					  .setColor('#0099ff')
					  .setTimestamp()
					  .addFields(
						  { name: 'Captured Text', value: "```"+captured_text+"```" },
						  { name: "Returned", value: "```"+evaled+"```" },
					  );
				ctx.channel.send(em);
			} catch (err) {
				ctx.channel.send("```"+err+"```");
			}
		}
	}
};
