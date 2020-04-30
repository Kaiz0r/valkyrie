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
const nc = require('../netcrawler.js');
const querystring = require('querystring');

exports.updateRecruits = {
	auto: async function(client){
		console.log("Updating Recruit monitor...");
		let record = client._config.get('recruit_records');
		if (record == undefined) {record = [];}

		for (const g of client.guilds.cache){
			let guild = g[1];
											  
			if (guild.id == "396716931962503169"){
				const channel = guild.channels.cache.find(ch => ch.name === 'botmasters-testzone');
				const recruit = guild.roles.cache.find(ch => ch.name === 'recruit');
				
				for (const m of guild.members.cache){
					let member = m[1];
					if(member.roles.cache.array().includes(recruit)){
						console.log(member.user.username);
						if (!record.includes(member.id) && member.presence.status != "offline"){
							channel.send(`monitor: ${member.user.username} has been seen.`);
							record.push(member.id);
							client._config.set('recruit_records', record);
						}
					}
					
				}
			}}}};

exports.thread = {
	help: "Thread manager",
	aliases: ['thr'],
	group: "utility",
	usage: "",
	flags: ["$hidden"],
	execute: async function(ctx){
		ctx.code(Object.keys(ctx.ext.threads).join("\n"));
	}
};

exports.reloadthread = {
	help: "Thread manager",
	aliases: ['rthr'],
	group: "utility",
	usage: "",
		flags: ["$hidden"],
	execute: async function(ctx){
		if (ctx.args.length == 0){
			ctx.ext.reload_threads();
		}else{
			ctx.ext.reload_threads(ctx.args[0]);
		}
	}
};

exports.stopthread = {
	help: "Thread manager",
	aliases: ['sthr'],
	group: "utility",
	usage: "",
		flags: ["$hidden"],
	execute: async function(ctx){
		ctx.ext.stopThread(ctx.args[0]);
	}
};

exports.haltthread = {
	help: "Thread manager",
	aliases: ['hthr'],
	group: "utility",
	usage: "",
		flags: ["$hidden"],
	execute: async function(ctx){
		let t = ctx.cfg.get('halted_threads');
		if (t == undefined) t = [];

		if(t.includes(ctx.args[0]))
			t.cut(ctx.args[0]);
		else
			t.push(ctx.args[0]);
		ctx.cfg.set('halted_threads', t);
		ctx.code(t.join(", "), '');
	}
};

exports.inspect = {
	help: "Views source code of a JS object.",
	aliases: ['src'],
	group: "utility",
	usage: "[fn]",
	execute: async function(ctx){
		let fn = undefined;
		if (ctx.args[0] == "cmd"){
			fn = ctx.commands.commands[ctx.args[1]].execute;
		}else if (ctx.args[0] == "common"){
			fn = common[ctx.args[1]];
		}else if (ctx.args[0] == "ctx"){
			if (ctx.args.length == 2)
				fn = ctx[ctx.args[1]];
			else if (ctx.args.length == 3)
				fn = ctx[ctx.args[1]][ctx.args[2]];
		}

		if (fn != undefined){ctx.code(fn.toString(), 'js');}else{ctx.say("Function definition not found.");}
		
	}
};
exports.whois = {
	help: "IP information lookup",
	aliases: ['ip'],
	group: "utility",
	usage: "[IP Address]",
	execute: async function(ctx) {
		let args = ctx.args;
		if (args.length == 0){ctx.channel.send("IP required."); return;}
		await nc.Whois(args[0], function(data){
			for (const c of Object.keys(data)){
				const loc = data[c];

			}	
		});
	
	}
};

exports.weather = {
	help: "Current weather for location",
	aliases: ['w'],
	group: "utility",
	usage: "[location]",
	execute: async function(ctx) {
		let args = ctx.args;
		if (args.length == 0){ctx.channel.send("location required."); return;}
		const w = new nc.WeatherAPI(ctx.cfg.get('weatherapikey'));

		await w.current(args.join(" "), function(data){
			console.log(data);
			const name = `${data.location.name}, ${data.location.region}, ${data.location.country} (${data.location.tz_id})`;
			const condition = `The current weather is ${data.current.condition.text}.`;
			const tempr = `The temperature is ${data.current.temp_c}°C / ${data.current.temp_f}°F (Feels like ${data.current.feelslike_c}°C / ${data.current.feelslike_f}°F)`;
			const winds = `There is winds from the ${data.current.wind_dir} with speeds of ${data.current.wind_kph} KPH.`;
			const em = new discord.MessageEmbed()
			.addField(name, `${condition}\n${tempr}\n${winds}`)
			.setThumbnail(`https:${data.current.condition.icon}`)
			.setFooter("Powered by WeatherAPI", "https://www.weatherapi.com/");
			ctx.channel.send(em);

		});
	}
};

exports.forecast = {
	help: "Current weather for location",
	aliases: ['fc'],
	group: "utility",
	usage: "[location]",
	execute: async function(ctx) {
		let args = ctx.args;
		if (args.length == 0){ctx.channel.send("location required."); return;}
		const w = new nc.WeatherAPI(ctx.cfg.get('weatherapikey'));

		const em = new discord.MessageEmbed();
		
		em.setFooter("Powered by WeatherAPI", "https://www.weatherapi.com/");
		await w.forecast(args.join(" "), 7 , function(data){
			for (const day of data.forecast.forecastday){
				console.log(day);
				const name = day.date;
				const condition = `The weather will be ${day.day.condition.text}.`;
				const tempr = `The temperature will be ${day.day.temp_c}°C / ${day.day.temp_f}°F (Feels like ${day.day.feelslike_c}°C / ${day.day.feelslike_f}°F)`;
				const winds = `There will be winds from the ${day.day.wind_dir} with speeds of ${day.day.wind_kph} KPH.`;
				const astro = `Sunrise will be at ${day.astro.sunrise}, and sunset will be at ${day.astro.sunset}.\Moonrise will be at ${day.astro.moonrise}, and moonset will be at ${day.astro.moonset}`;
				
				em.addField(name, `${condition}\n${tempr}\n${winds}\n${astro}`);
				
				em.setDescription(`${data.location.name}, ${data.location.region}, ${data.location.country} (${data.location.tz_id})`);
			}

			
			ctx.channel.send(em);

		});
	}
};

exports.covid = {
	help: "Covid lookup.",
	aliases: ['covid19', 'corona', 'ncov'],
	group: "utility",
	usage: "[search]",
	execute: async function(ctx) {
		await nc.Covid(async function(data){
			let args = ctx.args;
			const em = new discord.MessageEmbed();
			var total = 0;
			var total_cases = 0;
			var total_deaths = 0;
			var total_recov = 0;
			var total_tests = 0;
			var total_sources = [];
			
			//console.log(data);
			if(args.length == 0){
			}else{
				const search = args.join(" ");
				for (const c of Object.keys(data)){
					const loc = data[c];
					if(loc.name.lower().includes(search.lower())){
						//console.log(loc)
						total += 1;
						var out = `There are ${loc.cases} confirmed cases`;
						if (loc.population != undefined){out += ` out of a population of ${loc.population}`;}
						if (loc.tested != undefined){out += `, with ${loc.tested} citizens tested`;}
						out += ".";

						if (loc.deaths != undefined) {out += ` There has been ${loc.deaths} deaths recorded`;}
						if (loc.recovered != undefined) {out += ` with ${loc.recovered} recoveries`;}
						if (!out.endsWith("."))
						out += ".";
						
						if (loc.sources != undefined){
							out += `\n**Source: ${loc.sources[0].name} (${loc.sources[0].url})`;

							if (!total_sources.includes(`${loc.sources[0].name} (${loc.sources[0].url})`)){
								total_sources.push(`${loc.sources[0].name} (${loc.sources[0].url})`);
							}
						}
						
						total_cases += common.defaultNum(loc.cases);
						total_deaths += common.defaultNum(loc.deaths);
						total_recov += common.defaultNum(loc.recovered);
						total_tests += common.defaultNum(loc.tested);


						em.addField(loc.name, out, false);
					}

				}

				if (total == 0){
					ctx.channel.send("No results found.");
					return;
				}
				if (total <= 10){
					ctx.channel.send(em);
				}
				if (total > 10){
					const n = new discord.MessageEmbed()
						  .addField(`Statistics Gathered for ${search}`, `Using all the gathered data from that search, with ${total} locations, there has been ${total_cases} cases out of ${total_tests.as("unknown")} people tested, with ${total_deaths.as("unknown")} deaths and ${total_recov.as("unknown")} recoveries.`);
					
					if(total_sources.length > 0 && total_sources.length < 10){
						n.addField("Sources", total_sources.join("\n"));
					}

					if(total_sources.length >= 10){n.addField("Sources", `Various ${total_sources.length} sources.`);}
					
					ctx.channel.send(n);
				}
			}			
		});
	}
};

exports.youtube = {
	help: "Searches youtube.",
	aliases: ['yt'],
	group: "fun",
	execute: async function(ctx) {

	}
};

exports.run = {
	help: "Simulate command settings.",
	group: "admin",
	flags: ['$owner'],
	execute: async function(ctx) {
		let args = ctx.args;
		if (!checks.isOwner(ctx)){return;}
		const mode = args.shift();
		const target = args.shift();
		const command = args.shift();
		const cargs = args;

		if (mode == "as"){
			const m = ctx.findMember(target);
			var n = await ctx.newCtx(ctx.message);
			n.args = cargs;
			n.argsRaw = cargs.join(" ");
			n.member = m;
			n.author = m.user;

			ctx.channel.send(`Will run \`${command} [${n.argsRaw}]\` ${mode} ${m}`);

			await n.invoke(command);
		}else if ( mode == "in" ){
			const m = ctx.findChannel(target);
			var n = await ctx.newCtx(ctx.message);
						n.args = cargs;
			n.argsRaw = cargs.join(" ");
			n.channel = m;
			ctx.channel.send(`Will run \`${command} [${n.argsRaw}]\` ${mode} ${m}`);
			await n.invoke(command);			
		}
	}
};

exports.debug = {
	help: "Debugging properties.",
	group: "admin",
	flags: ['$hidden'],
	execute: async function(ctx) {
		let args = ctx.args;
		ctx.channel.send(`${ctx.member}\n${args}`);
	}
};

exports.echo = {
	help: "I repeat, echo.",
	group: "admin",
	flags: ['$hidden'],
	execute: async function(ctx) {
		ctx.channel.send(ctx.argsRaw);
	}
};

exports.set = {
	help: "Sets a var.",
	group: "admin",
	flags: ['$owner'],
	usage: "[key] [value]",
	execute: async function(ctx) {
		let args = ctx.args;
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
	execute: async function(ctx) {
		let args = ctx.args;
		if (!checks.isOwner(ctx)){return;}
		ctx.reply(ctx.cfg.get(args.join (" ")));
	}
};

exports.whitelist = {
	help: "Manages whitelisted users.",
	group: "admin",
	flags: ['$owner'],
	usage: "[member]",
	execute: async function(ctx) {
		let args = ctx.args;
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
	execute: async function(ctx) {
		let args = ctx.args;
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
	execute: async function(ctx) {
		let args = ctx.args;
		if (args.length != 0){
			var target = ctx.commands.commands[args[0]];

			if (target == undefined){
				for (const c of Object.keys(ctx.commands.commands)){
					const com = ctx.commands.commands[c];

					if (com.aliases.includes(args[0])){
						target = com;
						break;
					}
				}
			}

			
			if (target == undefined){
				ctx.channel.send(`Command ${args[0]} not found.`);
			}else{
				var output = "["+target.name.toUpperCase()+"]";
				
				if (target.group != undefined){output += "\nGroup: "+target.group;}

				if (target.aliases.length > 0){
					const al = target.name+"|"+target.aliases.join("|");
					output += "\nUsage: "+ctx.commands.prefix+"["+al+"] ";
				}else{
					output += "\nUsage: "+ctx.commands.prefix+target.name.toLowerCase()+" ";
				}
				
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
			let commands = 0;

			for (const group of Object.keys(sorts)){
				h += "["+group+"]\n";
				for (const command of sorts[group]){
					commands += 1;

					if (commands > 25){
						commands = 0;
						ctx.channel.send(common.code(h, 'ini'));
						h = "";
					}
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
	execute: async function(ctx) {
		ctx.channel.send("<https://discordapp.com/oauth2/authorize?client_id=507218821673648148&scope=bot>");	
	}
};

exports.unban = {
	help: "Unbans a user",
	execute: async function(ctx){
		ctx.guild.fetchBans().then(function(bans){
			for (const ban of bans.array()) {
				if (ban.user.id == ctx.args[0])
				ctx.guild.members.unban(ban.user.id).then(user => ctx.say(`Unbanned ${user.username} from ${ctx.guild.name}`));
			}
		});
	}
};

exports.gm = {
	help: "Pings a GMOD server.",
	group: "gaming",
	usage: "[ip] [port]",
	aliases: [],
	execute: async function(ctx) {
		let args = ctx.args;
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
	execute: async function(ctx) {
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
	execute: async function(ctx) {
		needle.get('https://random.dog/woof.json', function(error, response) {
			if (!error && response.statusCode == 200)
				ctx.channel.send(response.body.url);
		});
		
	}
};

exports.catfact = {
	help: " ",
	group: "animals",
	execute: async function(ctx) {
		needle.get('https://some-random-api.ml/facts/cat', function(error, response) {
			if (!error && response.statusCode == 200)
				ctx.channel.send(response.body.fact);
		});		
	}
};

exports.dogfact = {
	help: " ",
	group: "animals",
	execute: async function(ctx) {
		needle.get('https://some-random-api.ml/facts/dog', function(error, response) {
			if (!error && response.statusCode == 200)
				ctx.channel.send(response.body.fact);
		});		
	}
};
	
exports.dog2 = {
	help: "",
	group: "animals",
	aliases: [],
	execute: async function(ctx) {
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
	execute: async function(ctx) {
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
	execute: async function(ctx) {
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
	execute: async function(ctx) {
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
	execute: async function(ctx) {
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
	execute: async function(ctx) {
		needle.get('https://some-random-api.ml/pikachuimg', function(error, response) {
			if (!error && response.statusCode == 200)
				ctx.channel.send(response.body.link);
		});		
	}
};

exports.hug = {
	group: "meme",
	execute: async function(ctx) {
		needle.get('https://some-random-api.ml/animu/hug', function(error, response) {
			if (!error && response.statusCode == 200)
				ctx.channel.send(response.body.link);
		});
	}
};

exports.pat = {
	group: "meme",
	execute: async function(ctx) {
		needle.get('https://some-random-api.ml/animu/pat', function(error, response) {
			if (!error && response.statusCode == 200)
				ctx.channel.send(response.body.link);
		});		
	}
};

exports.wink = {
	group: "meme",
	execute: async function(ctx) {
		needle.get('https://some-random-api.ml/animu/wink', function(error, response) {
			if (!error && response.statusCode == 200)
				ctx.channel.send(response.body.link);
		});		
	}
};

exports.duck = {
	group: "animals",
	execute: async function(ctx) {
		needle.get('https://random-d.uk/api/quack', function(error, response) {
			if (!error && response.statusCode == 200)
				ctx.channel.send(response.body.url);
		});
	}
};

exports.redpanda = {
	group: "animals",
	execute: async function(ctx) {
		needle.get('https://some-random-api.ml/img/red_panda', function(error, response) {
			if (!error && response.statusCode == 200)
				ctx.channel.send(response.body.link);
		});
	}
};

exports.panda = {
	group: "animals",
	execute: async function(ctx) {
		needle.get('https://some-random-api.ml/img/panda', function(error, response) {
			if (!error && response.statusCode == 200)
				ctx.channel.send(response.body.link);
		});		
	}
};

exports.urban = {
	group: "api",
	execute: async function(ctx) {
		let page = 0;
		const ut = (str, max) => ((str.length > max) ? `${str.slice(0, max - 3)}...` : str);

		if (!isNaN(ctx.args[0])){page = ctx.args.shift().toNumber();}
		const query = querystring.stringify({ term: ctx.args.join(' ') });
		needle.get(`https://api.urbandictionary.com/v0/define?${query}`, function(error, response) {
			if (!error && response.statusCode == 200){
				let list = response.body.list;
				let answer = list[page];
				if (answer == undefined){ctx.say(`${ctx.args.join(' ')} not found.`); return;}
				const embed = new discord.MessageEmbed()
					  .setColor('#EFFF00')
					  .setTitle(answer.word)
					  .setURL(answer.permalink)
					  .addFields(
						  { name: 'Definition', value: ut(answer.definition, 1024) },
						  { name: 'Example', value: ut(answer.example, 1024) },
						  { name: 'Rating', value: `👍 ${answer.thumbs_up} / 👎 ${answer.thumbs_down}` }
					  );

				ctx.channel.send(embed);
			}
		});		
	}
};

exports.lua = {
	help: "Evaluates arbtirary LUA code.",
	group: "utility",
	aliases: [],
	flags: ['$whitelist'],
	usage: ['[code]'],
	execute: async function(ctx) {
		let args = ctx.args;
		if (!checks.isWhitelisted(ctx)){ctx.channel.send("Access denied.");return;}
		args = args.join(" ");
		args = args.replace("```lua", "");
		args = args.replace("```", "");
		console.log(`args ${args}`);
		const em = new discord.MessageEmbed();

		var intercept = require("intercept-stdout"),
			captured_text = "";

		var unhook_intercept = intercept(function(txt) {
			captured_text += txt;
		});
		
		let returnValue = undefined;
		
		try{
		returnValue = luaEnv.parse(args).exec();
		}catch(err){returnValue = `Error! ${err}`;}

		unhook_intercept();

		if (captured_text != ""){em.addField("Captured Text", "```\n"+captured_text+"\n```" );}
		if (returnValue != undefined){em.addField("Returned", "```\n"+returnValue+"\n```" );}
		
		em.setAuthor(ctx.member.nickname, ctx.member.user.avatarURL(), '');
		em.setColor('#0099ff');
		em.setTimestamp();

		if (captured_text == "" && returnValue == undefined) { ctx.channel.send("No data returned."); return;}
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
	execute: async function(ctx) {
		let args = ctx.args;
		if (!checks.isWhitelisted(ctx)){ctx.channel.send("Access denied.");return;}
		args = args.join(" ");
		args = args.replace("```js", "");
		args = args.replace("```", "");
		let outs = 0;
		
		if (args == ""){
			ctx.channel.send("```Requires code to execute.```");
		}else{
			try {
				const em = new discord.MessageEmbed();
				var intercept = require("intercept-stdout"),
					captured_text = "";
				var unhook_intercept = intercept(function(txt) {
					captured_text += txt;
				});
				let evaled = eval(args);
				if (evaled instanceof Promise) evaled = await evaled;
				unhook_intercept();
				if (captured_text == ""){captured_text = "undefined";}
				
				em.setAuthor(ctx.member.nickname, ctx.member.user.avatarURL(), '');
				em.setColor('#0099ff');
				em.setTimestamp();
				
				if (captured_text != "" && captured_text != "undefined" && captured_text != undefined){em.addField("Captured Text", "```\n"+captured_text+"\n```" );outs += 1;}
				if (evaled != undefined){em.addField("Returned", "```\n"+evaled+"\n```" );outs += 1;}

				if (outs > 0)
					ctx.channel.send(em);
				
			} catch (err) {
				ctx.channel.send("```"+err+"```");
			}
		}
	}
};
