const ytsr = require('ytsr');
const ytdl = require('ytdl-core');
const fs = require('fs');
var needle = require('needle');
const discord = require('discord.js');
const checks = require('../checks.js');

/*
TTS

Store a local playlist for users
works, but need pagination


playfile have option to detect attachment in message
if no attachment and no URL, then search pythen sound dir

url detection in play

a cfg length limit, starting at 500s
*/
exports.connect = {
	help: "Joins the voice channel the user is in.",
	group: "audio",
	aliases: ['join'],
	execute: async function(ctx) {
		let r = await ctx.connect_voice();
		
		if (r){
			ctx.reply("Joined channel.");
		}else{
			ctx.reply("Could not join.");
		}	
	}
};

exports.disconnect = {
	help: "Disconnects from the voice channel.",
	group: "audio",
	aliases: ['dc'],
	execute: async function(ctx) {
		await ctx.cleanup_voice(ctx);
	}
};

exports.nowplaying = {
	help: "Shows what is currently playing.",
	group: "audio",
	aliases: ['np'],
	execute: async function(ctx) {
		let vc = await ctx.voiceClient();
		ctx.reply(vc.currently_playing);		
	}
};

exports.playlist = {
	help: "Shows the playlist.",
	group: "audio",
	aliases: ['pl'],
	execute: async function(ctx) {
		let vc = await ctx.voiceClient();

		var outp = "";
		console.log(vc.playlist);
		vc.playlist.forEach(function(item){
			let name = "";
			if (item.user.nickname == undefined){name = item.user.nickname;}else{name = item.user.user.username;}
			outp += `${item.title} (${item.lengthParsed}) by ${name}\n`;
		});

		ctx.reply(outp);		
	}
};

exports.stop = {
	help: " ",
	group: "audio",
	aliases: [],
	execute: async function(ctx) {
		var vc = await ctx.vm.getClient(ctx);
		vc.dispatcher.emit('quit');
	}
};

exports.skip = {
	help: " ",
	group: "audio",
	aliases: [],
	execute: async function(ctx) {
		var vc = await ctx.vm.getClient(ctx);
		vc.dispatcher.emit('finish');
	}
};

exports.volume = {
	help: " ",
	group: "audio",
	aliases: [],
	usage: "[Number: 0-100]",
	execute: async function(ctx) {
		let args = ctx.args;
		var vc = await ctx.vm.getClient(ctx);
		const vol = Number(args[0]);
		vc.dispatcher.setVolume(vol / 100);
	}
};

exports.pause = {
	help: " ",
	group: "audio",
	aliases: [],
	execute: async function(ctx) {
		var vc = await ctx.vm.getClient(ctx);
		if (vc.dispatcher.paused){
			vc.dispatcher.resume();
		}else{
			vc.dispatcher.pause();
		}
		
	}
};

exports.importstations = {
	help: " ",
	group: "#hidden",
	aliases: [],
	execute: async function(ctx) {
		let rawdata = fs.readFileSync('/home/bots/PythenaRewrite/radio.json');
		ctx.cfg.set('radio', JSON.parse(rawdata));
		ctx.channel.send("Imported PythenaRewrite/radio.js in to Valk config.");
	}
};

exports.station = {
	help: "Plays a radio station.",
	group: "audio",
	aliases: ['st'],
	execute: async function(ctx) {
		let args = ctx.args;
		args = args.join(" ");

		if (ctx.member.voice && ctx.member.voice.channel) {

			const channels = ctx.cfg.get('radio');
			if (channels[args] != undefined){
				const c = channels[args];
				await ctx.play({"stream": c.url, "title": c.name, "user": ctx.member, "length": "∞", "lengthParsed": "∞"});	
			}else{
				ctx.channel.send("Station not found.");
			}
		}	
	}
};

exports.stations = {
	help: "Lists known radio stations.",
	group: "audio",
	aliases: ['sls'],
	execute: async function(ctx) {
		const channels = ctx.cfg.get('radio');
		ctx.channel.send(Object.keys(channels).join("\n"));
	}
};

exports.lyrics = {
	help: "Shows lyrics for a song",
	group: "audio",
	aliases: ['lyric', 'lyr'],
	usage: ['[search term* or currently playing if not provided]'],
	flags: ['$wip'],
	execute: async function(ctx) {
		let args = ctx.args;
		let title = "";
		if(args.length == 0){
			let vc = await ctx.voiceClient();
			title = vc.currently_playing;			
		}else title = args.join("+");
		
		needle.get(`https://some-random-api.ml/lyrics?title=${title}`, function(error, response) {
			if (!error && response.statusCode == 200){
				if (response.error != undefined){ctx.channel.send(response.error); return;}
				const em = new discord.MessageEmbed();
				if(response['thumbnail']['genius'] != undefined){em.setThumbnail(response['thumbnail']['genius']);}
				
				if (response.lyrics.length > 1000){
					em.setDescription(`${response.title} by ${response.author}`);
					const verses = response.lyrics.split("\n\n");
					for (const verses of verses){
						let v = verse.split("\n");
						const b = v.shift();
						const r = v.join("\n");
						em.addField(b, r, false);
					}
					
				}else{
					em.addField(`${response.title} by ${response.author}`, response.lyrics);
					
				}
				ctx.channel.send(em);
			}
		});	
	}
};

exports.save = {
	help: "Stores a track in your personal favourites.",
	group: "audio",
	aliases: ['sv', 'bm'],
	usage: ['[search term* or currently playing if not provided]'],
	flags: ['$wip'],
	execute: async function(ctx) {
		let args = ctx.args;
		var mcfg = ctx.cfg.get(ctx.member.id);
		if (mcfg == undefined) mcfg = {};
		if (mcfg.audioFav == undefined) mcfg.audioFav = [];

		if (args.length == 0){
			let vc = await ctx.voiceClient();
			args = vc.currently_playing;	
		}else args = args.join(" ");
		
		if (mcfg.audioFav.includes(args)){
			mcfg.audioFav.cut(args);
			ctx.channel.send(`${args} removed.`);
		}else{
			mcfg.audioFav.push(args);
			ctx.channel.send(`${args} saved.`);
		}
		ctx.cfg.set(ctx.member.id, mcfg);
	}
};

exports.saves = {
	help: "Shows favourites.",
	group: "audio",
	aliases: ['svs', 'bms'],
	flags: ['$wip'],
	execute: async function(ctx) {
		let args = ctx.args;
		var mcfg = ctx.cfg.get(ctx.member.id);
		if (mcfg == undefined) mcfg = {};
		if (mcfg.audioFav == undefined) mcfg.audioFav = ['None'];

		if(args.length == 0)
			ctx.channel.send(`${mcfg.audioFav.join("\n")}`);
		else{
			let out = "";

			for(const line of mcfg.audioFav){
				if(line.lower().includes(args.join(" ").lower())){
					out += `${line}\n`;
				}
			}
			console.log(out);
			if (out != ""){ctx.channel.send(out);}else{ctx.channel.send("No results.");}
		}
	}
};

exports.vtts = {
	help: "Voice synth.",
	group: "audio",
	aliases: ['vo'],
	usage: ['[message]'],
	flags: ['$concept'],
	execute: async function(ctx) {
		
	}
};

exports.vcfilter = {
	help: "Stores a track in your personal favourites.",
	group: "audio",
	aliases: ['vcf'],
	usage: ['[search term]'],
	flags: ['$wip'],
	execute: async function(ctx) {
		let args = ctx.args;
		if (!checks.isWhitelisted(ctx)){ctx.channel.send("Access denied.");return;}
		var mcfg = ctx.cfg.get("audio_search_filters", []);
		if (args.length == 0){
			ctx.channel.send(`Fitlers: ${mcfg}`);
			return;
		}
		args = args.join(" ");

		if (mcfg.includes(args)){
			mcfg.cut(args);
			ctx.channel.send("Filter removed.");
		}else{
			mcfg.push(args);
			ctx.channel.send("Filter added.");
		}
		ctx.cfg.set("audio_search_filters", mcfg);
	}
};

exports.vcclr = {
	help: "Defines values to hide from song track names..",
	group: "audio",
	aliases: ['vclr'],
	usage: ['[search term]'],
	flags: ['$wip'],
	execute: async function(ctx) {
		let args = ctx.args;
		if (!checks.isWhitelisted(ctx)){ctx.channel.send("Access denied.");return;}
		var mcfg = ctx.cfg.get("audio_search_clean", []);
		if (args.length == 0){
			ctx.channel.send(`Fitlers: ${mcfg}`);
			return;
		}
		args = args.join(" ");

		if (mcfg.includes(args)){
			mcfg.cut(args);
			ctx.channel.send("Filter removed.");
		}else{
			mcfg.push(args);
			ctx.channel.send("Filter added.");
		}
		ctx.cfg.set("audio_search_clean", mcfg);
	}
};

function filterResults(ctx, data){ //to try again
	//const filters = ['official video', 'full album'];
	const filters = ctx.cfg.get('audio_search_filters', ['official video', 'full album']);
	for (const t of data){
		console.log(t);
		let valid = true;
		for(const f of filters){
			
			console.log(`does ${t.title} include ${f}`);
			if(t.title.lower().includes(f)){
				console.log("tis does, banish");
				valid = false;
				
			}
				
		}
		if (valid) return t.link;
	}
	return undefined;
}

exports.play = {
	help: "Plays audio to the current voice channel.",
	group: "audio",
	aliases: ['p'],
	execute: async function(ctx) {
		let args = ctx.args;
		args = args.join(" ");
		let first = false;
		if (args.includes("-first")){
			first = true;
			args = args.replace("--first", '');
		}
		if (ctx.member.voice && ctx.member.voice.channel) {
			var options = {
				limit: 10
			};

			ytsr(args, options, function(err, searchResults) {
				if(err) throw err;
				let url = "";
				if(!first)
					url = filterResults(ctx, searchResults['items']);
				else
					url = searchResults['items'][0]['link']; //change to cycle through items to find one that isnt filtered
				
				ytdl.getInfo(url, async function(err, info) {
					let title = info['player_response']['videoDetails']['title'];
					let len = info['player_response']['videoDetails']['lengthSeconds'];
					
					let lenh = len.asTime();
					let stream = info["formats"][0]["url"]; //change to cycle through formats and find one thats mimeType: audio/xxxxx
					await ctx.play({"stream": stream, "title": title, "user": ctx.member, "length": len, "lengthParsed": lenh});	
							
				});
			});	
		}	
	}
};

exports.playfile = {
	help: "Plays audio to the current voice channel.",
	group: "audio",
	aliases: ['pf'],
	execute: async function(ctx) {
		let args = ctx.args;
		args = args.join(" ");

		if (ctx.member.voice && ctx.member.voice.channel) {
			await ctx.play({"stream": args, "title": args, "user": ctx.member, "length": "N/A", "lengthParsed": "N/A"});	

		}	
	}
};
