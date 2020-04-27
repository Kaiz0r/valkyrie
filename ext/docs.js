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
	execute: async function(ctx) {
		let args = ctx.args;
		if (args.length == 0){
			let out = "";
			for (const d of Object.keys(docs)){
				const doc = docs[d];
				if(doc.get != undefined){out += "💠";}else{out += "🔷";}
				out += `\`${doc.name} (${doc.version})\`: <${doc.url}>\n`;
			}
			ctx.channel.send(out);
		}else{
			const name = args.shift();
			if (name == "glua") name = "gwiki";
			console.log(name);
			console.log(docs[name]);
			if(docs[name] == undefined){
				ctx.channel.send("Doc not found.");
			}else if(docs[name].get == undefined){
				ctx.channel.send(`${docs[name].name} does not support crawling functionality yet.`);
			}else{
				await docs[name].get(args[0], function(data){
					let em = new discord.MessageEmbed();
					let fields = 0;
					if (name == "gwiki"){
						for (const ob of data){
							if(ob.function != undefined){
								let body = ob.function.description;	let usage = "";	let args = "";	let rets = "";

								if(ob.function.args != undefined){
									if (common.isArray(ob.function.args.arg)){
										for(const arg of ob.function.args.arg){
											usage += `[**${arg.name}**<${arg.type}>] `;
											args += `**${arg.name}**<${arg.type}>: ${arg.text}\n`;
										}
									}else if(common.isObject(ob.function.args.arg)){
										let arg = ob.function.args.arg;
										usage += `[**${arg.name}**<${arg.type}>]`;
										args += `**${arg.name}**<${arg.type}>: ${arg.text}\n`;
									}
								}

								if(ob.function.rets != undefined){
									rets = `${ob.function.rets.ret.type} (${ob.function.rets.ret.text})`;
								}

								if(usage != ""){body +=`\n\n**Usage**:\n\t${usage}`;}
								if(rets != ""){body += `\n**Returns** ${rets}\n`;}
								body += `\n${args}`;
								fields += 1;if (fields > 10){ctx.channel.send(em); fields=0; em = new discord.MessageEmbed();}
								em.addField(`${ob.function.parent}.${ob.function.name} [${ob.function.realm}]`, body);
								
								if(common.isObject(ob.example)){
									console.log(ob.example);
									fields += 1;if (fields > 10){ctx.channel.send(em); fields=0; em = new discord.MessageEmbed();}
									em.addField(`${ob.function.parent}.${ob.function.name} example`,
												`${ob.example.description.substring(0, 1000)}\n\`\`\`lua\n${ob.example.code}\n\`\`\`\n**Output**: ${ob.example.output}`);
								}else if(common.isArray(ob.example)){
									for (const example of ob.example){
									fields += 1;if (fields > 10){ctx.channel.send(em); fields=0; em = new discord.MessageEmbed();}
									em.addField(`${ob.function.parent}.${ob.function.name} example`,
												`${example.substring(0, 1000)}\n\`\`\`lua\n${example.code}\n\`\`\`\n**Output**: ${example.output}`);
									}
								}
								
							}else if(ob.enum != undefined && common.isObject(ob.enum)){
								if( typeof(ob.enum.description) == String || ob.enum.description.text != undefined){
									fields += 1;if (fields > 10){ctx.channel.send(em); fields=0; em = new discord.MessageEmbed();}
									em.addField("ENUM", "Todo.");
								}
								
							}else if(ob.enum != undefined && common.isArray(ob.enum)){
								for (let i = 0; i < ob.enum.length; i++) {
									let en = ob.enum[i];		
									if( typeof(en.description) == String || en.description.text != undefined){
										fields += 1;
										if (fields > 10){ctx.channel.send(em); fields=0; em = new discord.MessageEmbed();}
										em.addField("ENUM", "Todo.");
									}
								}
							}
							
						}
					}else{
						for (const r of data){
							fields += 1;
							if (fields > 10){ctx.channel.send(em); fields=0; em = new discord.MessageEmbed();}
							let desc = r[1].stripAll(" ");
							if (desc == "") desc = "No information.";
							em.addField(r[0], desc.substring(0, 1000));
						}
					}
					
					if(data != undefined)
						ctx.channel.send(em);
					else
						ctx.channel.send("No results found.");
				
				});
			}
		}

	}
};
