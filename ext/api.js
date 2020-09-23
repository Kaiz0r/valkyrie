var needle = require('needle');
var fs = require('fs');
var common = require("../common.js");
const discord = require('discord.js');
var emoji = require('node-emoji');
function cleanupHost(i){
	i = i.replace("Ã¿", "");
	i = i.replace("Ã¿Ã¿Ã¿", "");
	i = i.replace("ÂÃ¿", "");
	i = i.replace("Ã¿Â", "");
	i = i.replace("Ã¿", "");
	return i;
}
exports.addcustomlist = {
	help: "Save a server query",
	aliases: ["cs"],
	group: "api",
	execute: async function(ctx){
		var ls = ctx.cfg.get("custom_servers_"+ctx.guild.id, []);
		ls.push(ctx.argsRaw);
		ctx.cfg.set("custom_servers_"+ctx.guild.id, ls);
	}
};

exports.srv = {
	help: "Save a server query",
	aliases: ["servers"],
	group: "api",
	execute: async function(ctx){
		var ls = ctx.cfg.get("custom_servers_"+ctx.guild.id, []);
		
	}
};

exports.savealias = {
	help: "Save a server query",
	aliases: ["serveralias", "333nalias"],
	group: "api",
	execute: async function(ctx){
		var alias = ctx.argsRaw.split("=")[0];
		var query = ctx.argsRaw.split("=")[1];
		ctx.cfg.set("333alias_"+alias, query);
	}
};

exports.tri = {
	help: "List 333networks",
	aliases: ["list", "dx", "serv", "srv", "servers"],
	group: "api",
	execute: async function(ctx){
		const url = "333networks.com/json/";
		if (ctx.argsRaw == "" && ctx.guild.id == "518736692346093569") ctx.argsRaw = "unreal";
		if (ctx.argsRaw.startsWith("#")){ctx.argsRaw = ctx.cfg.get("333alias_"+ctx.argsRaw.replace("#", ""));}
		if (ctx.argsRaw == "undefined"){ctx.say("Error handling input...");return;}
		if (ctx.argsRaw.includes("/")){ //SERVER mode
			needle.get(url+ctx.argsRaw, function(error, response) {
				const embed = new discord.MessageEmbed();
				if (!error && response.statusCode == 200){
					
					const server = response.body;
					var cf = "";
					if (server.country != undefined) cf = emoji.get("flag-"+server.country.toLowerCase());
					var text = `**Map**: ${server.mapname}\n**Game**: ${server.gametype}\n**Admin**: ${server.adminname} (${server.adminemail})\n**Address**: ${server.ip}:${server.port}\n`;

					if (server.mutators != "None"){text += `**Mutators**: ${server.mutators}\n`;}
					if (server.goalteamscore != undefined){text += `**Team Score Limit**: ${server.goalteamscore}\n`;}
					if (server.fraglimit != undefined){text += `**Frag Limit**: ${server.fraglimit}\n`;}
					embed.addField(`${cf} ${cleanupHost(server.hostname)} (${server.numplayers}/${server.maxplayers})`, text);

					for (i=0;i<server.numplayers;i++){
						console.log(i);
						let p = server[`player_${i}`];
						embed.addField(p.player, `**Ping**: ${p.ping} | **Frags**: ${p.frags} | ${p.skin}; ${p.mesh}\n`);
					}
				}else{
					embed.addField("ERROR", `Host address did not respond. ${error} ${response.statusCode}`);
				}
				
				ctx.say(embed);
			});	
		}else{ //MS-LIST mode
			var g = ctx.argsRaw;
			var page = 0;
			if (g.includes(";")){
				page = g.split(";")[1].toNumber();
				g = g.split(";")[0];
			}
			var start = 0;
			var end = 10;
			if (page > 0){
				start = page*10;
				end = (page+1)*10;
			}
			needle.get(url+g+"?s=numplayers&o=d", function(error, response) {
				const embed = new discord.MessageEmbed();
				if (!error && response.statusCode == 200){
					
					var i = 0;

					for (const server of response.body[0]){
						if (i >= start){
							var cf = "";
							if (server.country != undefined)
								cf = emoji.get("flag-"+server.country.toLowerCase());
							embed.addField(`${cf} ${cleanupHost(server.hostname)} (${server.numplayers}/${server.maxplayers})`,
										   `**Map**: ${server.mapname}\n**Game**: ${server.gametype}\n**Address**: ${server.ip}:${server.hostport}`);
						}
						i += 1;
						if (i == end) break;
					}

					embed.addField(`Results Page #${page} (${start}-${end})`,
								   `Game: ${g.lower()}\nServers: ${response.body[1].total}\nPlayers: ${response.body[1].players}`);
				}else{
					console.log(response.body)
					embed.addField("ERROR", response.statusCode);
				}
				ctx.say(embed);
			});		
		}
		
	}
};

exports.trih = {
	help: "Searches 333networks",
	aliases: ["listh"],
	group: "api",
	execute: async function(ctx){
		const url = "333networks.com/json/";
		if (ctx.argsRaw == "" && ctx.guild.id == "518736692346093569") ctx.argsRaw = "unreal/176.9.50.118";

		var g = ctx.argsRaw.split("/")[0];
		var search = ctx.argsRaw.split("/")[1];

		needle.get(url+g+"?s=numplayers&o=d", function(error, response) {
			const embed = new discord.MessageEmbed();
			if (!error && response.statusCode == 200){
				var i = 0;

				for (const server of response.body[0]){
					if(server.ip.startsWith(ctx.argsRaw)){
						var cf = emoji.get("flag-"+server.country.toLowerCase());
						embed.addField(`${cf} ${cleanupHost(server.hostname)} (${server.numplayers}/${server.maxplayers})`,
									   `**Map**: ${server.mapname}\n**Game**: ${server.gametype}\n**Address**: ${server.ip}:${server.hostport}`);
					}
					
				}

				embed.addField(`Results`,
							   `Game: ${g.lower()}\nServers: ${response.body[1].total}\nPlayers: ${response.body[1].players}`);
			}else{
				embed.addField("ERROR", error);
			}
			ctx.say(embed);
		});		
	}
};

exports.tris = {
	help: "Searches 333networks",
	aliases: ["lists"],
	group: "api",
	execute: async function(ctx){
		const url = "333networks.com/json/";
		if (ctx.argsRaw == "" && ctx.guild.id == "518736692346093569") ctx.argsRaw = "unreal/newbiesplayground";

		var g = ctx.argsRaw.split("/")[0];
		var search = ctx.argsRaw.split("/")[1];

		needle.get(url+g+"?s=numplayers&o=d&q="+search, function(error, response) {
			const embed = new discord.MessageEmbed();
			if (!error && response.statusCode == 200){
				var i = 0;

				for (const server of response.body[0]){
						var cf = emoji.get("flag-"+server.country.toLowerCase());
						embed.addField(`${cf} ${cleanupHost(server.hostname)} (${server.numplayers}/${server.maxplayers})`,
									   `**Map**: ${server.mapname}\n**Game**: ${server.gametype}\n**Address**: ${server.ip}:${server.hostport}`);
					i += 1;
					if (i == 10) break;
				}

				embed.addField(`Results`,
							   `Game: ${g.lower()}\nServers: ${response.body[1].total}\nPlayers: ${response.body[1].players}`);
			}else{
				embed.addField("ERROR", error);
			}
			ctx.say(embed);
		});		
	}
		
};

exports.wquery = {
	help: "",
 	group: "api",
	aliases: ["wq"],
	execute: async function(ctx) {
		let url = "https://api.wolframalpha.com/v1/simple?i="+ctx.args.join('%20').replace('?', '%3F')+"&appid="+ctx.cfg.get("wolfram");
		/*needle.get(url, { output: 'wolfram.gif'}, function(err, resp, body) {
			ctx.channel.send({files: ['wolfram.gif']});
			});*/
		echo(url);
		needle.get(url, function(error, response) {
			if (error) throw error;
			if (!error && response.statusCode == 200)
				fs.writeFile('wolfram.gif', new Buffer.from(response.body), function(err){
					if (err) throw err;
					ctx.channel.send({files: ['wolfram.gif']});
				});
				
		});		
	}
};
exports.wolfram = {
	help: "",
	group: "api",
	aliases: [],
	execute: async function(ctx) {
		let url = "https://api.wolframalpha.com/v1/result?i="+ctx.args.join('%20').replace('?', '%3F')+"&appid="+ctx.cfg.get("wolfram");
		echo(url);
		needle.get(url, function(error, response) {
			if (!error && response.statusCode == 200)
				ctx.channel.send(response.body);
		});		
	}
};
