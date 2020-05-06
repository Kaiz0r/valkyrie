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
			needle.get(url+ctx.argsRaw, function(error, response) {
				const embed = new discord.MessageEmbed();
				if (!error && response.statusCode == 200){
					for (const server of response.body[0]){
						embed.addField(`[${server.country}] ${server.hostname} (${server.numplayers}/${server.maxplayers})`, `**Map**: ${server.mapname} (${server.maptitle})\n**Game**: ${server.gametype}\n**Address**: ${server.ip}:${server.hostport}`);
					}

					embed.addField("Results", `Game: ${ctx.argsRaw.lower()}\nServers: ${response.body[1].total}\nPlayers: ${response.body[1].players}`);
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