var needle = require('needle');
var fs = require('fs');
var common = require("../common.js");
const discord = require('discord.js');

exports.tri = {
	help: "Searches 333networks",
	aliases: ["list", "dx"],
	group: "api",
	execute: async function(ctx){
		const url = "333networks.com/json/";
		
		if (ctx.argsRaw.includes("/")){ //SERVER mode
			needle.get(url+ctx.argsRaw, function(error, response) {
				const embed = new discord.MessageEmbed();
				if (!error && response.statusCode == 200){
					
					const server = response.body;
					embed.addField(`${server.hostname} (${server.numplayers}/${server.maxplayers})`, `**Map**: ${server.mapname} (${server.maptitle})\n**Game**: ${server.gametype}\n**Mutators**: ${server.mutators}\n**Admin**: ${server.adminname} (${server.adminemail})\n**Address**: ${server.ip}:${server.port}`);
	

				}else{
					embed.addField("ERROR", error.toString());
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
			needle.get(url+g, function(error, response) {
				const embed = new discord.MessageEmbed();
				if (!error && response.statusCode == 200){
					var i = 0;

					
					for (const server of response.body[0]){
						if (i >= start)
							embed.addField(`[${server.country}] ${server.hostname} (${server.numplayers}/${server.maxplayers})`,
									   `**Map**: ${server.mapname} (${server.maptitle})\n**Game**: ${server.gametype}\n**Address**: ${server.ip}:${server.hostport}`);
						i += 1;
						if (i == end) break;
					}

					embed.addField(`Results Page #${page} (${start}-${end})`,
								   `Game: ${ctx.argsRaw.lower()}\n
									Servers: ${response.body[1].total}\nPlayers: ${response.body[1].players}`);
				}else{
					embed.addField("ERROR", error.toString());
				}
				ctx.say(embed);
			});		
		}
		
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
