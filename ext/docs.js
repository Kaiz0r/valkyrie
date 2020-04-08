const common = require('../common.js');
const print = common.print;
const util = require('util');
const discord = require('discord.js');
const checks = require('../checks.js');
const {docs} = require('../yggdrasil.js');


exports.documentation = {
	help: "Documentation system.",
	aliases: ['doc', 'docs'],
	group: "utility",
	usage: "[code] [search] | Lists sites if no params given",
	execute: async function(ctx, args) {
		if (args.length == 0){
			let out = "";
			for (const d of Object.keys(docs)){
				const doc = docs[d];
				out += `${doc.name} (${doc.version}): <${doc.url}>\n`;
			}
			ctx.channel.send(out);
		}else{
			const name = args.shift();
			console.log(name);
			console.log(docs[name]);
			if(docs[name] == undefined){
				ctx.channel.send("Doc not found.");
			}else if(docs[name].get == undefined){
				ctx.channel.send(`${docs[name].name} does not support crawling functionality yet.`);
			}else{
				await docs[name].get(args[0], function(data){
					if(data != undefined){
						const em = new discord.MessageEmbed();

						for (const r of data){
							let desc = r[1].stripAll(" ");
							if (desc == "") desc = "No information.";
							em.addField(r[0], desc);
						}
						ctx.channel.send(em);
					}
					else
						ctx.channel.send("No results found.");
				});
			}
		}

	}
};
