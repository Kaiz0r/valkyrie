const ytsr = require('ytsr');
const ytdl = require('ytdl-core');
const fs = require('fs');
/*
Try a pause/unpause command.
Need a stop command too.
*/
exports.connect = {
	help: "Joins the voice channel the user is in.",
	group: "audio",
	aliases: ['join'],
	execute: async function(ctx, args) {
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
	execute: async function(ctx, args) {
		await ctx.cleanup_voice(ctx);
	}
};

exports.nowplaying = {
	help: "Shows what is currently playing.",
	group: "audio",
	aliases: ['np'],
	execute: async function(ctx, args) {
		let vc = await ctx.voiceClient();
		ctx.reply(vc.currently_playing);		
	}
};

exports.playlist = {
	help: "Shows the playlist.",
	group: "audio",
	aliases: ['pl'],
	execute: async function(ctx, args) {
		let vc = await ctx.voiceClient();

		var outp = "";
		console.log(vc.playlist);
		vc.playlist.forEach(function(item){
			outp += `${item.title} by ${item.user.nickname}\n`;
		});

		ctx.reply(outp);		
	}
};

exports.stop = {
	help: " ",
	group: "audio",
	aliases: [],
	execute: async function(ctx, args) {
		var vc = await ctx.vm.getClient(ctx);
		vc.dispatcher.emit('quit')
	}
};

exports.skip = {
	help: " ",
	group: "audio",
	aliases: [],
	execute: async function(ctx, args) {
		var vc = await ctx.vm.getClient(ctx);
		vc.dispatcher.emit('finish')
	}
};

exports.volume = {
	help: " ",
	group: "audio",
	aliases: [],
	execute: async function(ctx, args) {
		var vc = await ctx.vm.getClient(ctx);
		const vol = Number(args[0]);
		vc.dispatcher.setVolume(vol / 100);
	}
};

exports.pause = {
	help: " ",
	group: "audio",
	aliases: [],
	execute: async function(ctx, args) {
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
	execute: async function(ctx, args) {
		let rawdata = fs.readFileSync('/home/bots/PythenaRewrite/radio.json');
		ctx.cfg.set('radio', JSON.parse(rawdata));
		ctx.channel.send("Imported PythenaRewrite/radio.js in to Valk config.");
	}
};

exports.station = {
	help: "Plays a radio station.",
	group: "audio",
	aliases: ['st'],
	execute: async function(ctx, args) {
		args = args.join(" ");

		if (ctx.member.voice && ctx.member.voice.channel) {

			const channels = ctx.cfg.get('radio');
			if (channels[args] != undefined){
				const c = channels[args];
				await ctx.play({"stream": c.url, "title": c.name, "user": ctx.member});	
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
	execute: async function(ctx, args) {
		const channels = ctx.cfg.get('radio');
		ctx.channel.send(Object.keys(channels).join("\n"));
	}
};

exports.play = {
	help: "Plays audio to the current voice channel.",
	group: "audio",
	aliases: ['p'],
	execute: async function(ctx, args) {
		args = args.join(" ");

		if (ctx.member.voice && ctx.member.voice.channel) {
			var options = {
				limit: 5
			};

			ytsr(args, options, function(err, searchResults) {
				if(err) throw err;
				let url = searchResults['items'][0]['link'];
				ytdl.getInfo(url, async function(err, info) {
					let title = info['player_response']['videoDetails']['title'];
					let stream = info["formats"][0]["url"];
					await ctx.play({"stream": stream, "title": title, "user": ctx.member});				
				});
			});	
		}	
	}
};
