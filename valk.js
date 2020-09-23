const Discord = require('discord.js');
const inspire = require('./inspire.js');
var common = require('./common.js');
var emoji = require('node-emoji');
var colors = require('colors');
var ext = require('./ext.js');

const client = new Discord.Client();
var cfg = new common.ConfigManager();
client._config = cfg;
const prefix = cfg.get('prefix', '$');
const token = cfg.get('token');
var com = new ext.ExtManager(client, prefix);
const emoji_down = emoji.get(":arrow_down:");
const emoji_up = emoji.get(":arrow_up:");
const emoji_star = emoji.get(":star:");
const print = common.print;
var last_channel = undefined;

// WOW server
// https://github.com/AshamaneProject/AshamaneCore/blob/7e448fe1766106f37c9c59814c72ac40f1abd478/contrib/ServerRelay/server.js
process.on('unhandledRejection', (error) => console.error('Uncaught Promise Rejection', error));
process.on('uncaughtException', function(err) {
	console.log('Caught exception: ' + err);
	if (last_channel != undefined) last_channel.send(`Unhandled Error: ${err}`);
});
client.on("disconnected", function () { process.exit(1); });
client.on('ready', () => {
	print('Running Node '.rainbow+process.version.rainbow, tag='info');
	print(`Logged in as ${client.user.tag}!`, tag='info');
	print('Loaded prefix: `'+prefix+'`', tag='info');
	com.reload_ext();
	com.reload_threads();
	client.user.setActivity('Node '+process.version);

	//INSPIRE_FRAMEWORK
	client.inspire = new inspire.Inspire();
	client.inspire.golem.addCommand('!restart', function(g, m) {
		client.inspire = new inspire.Inspire();
		client.inspire.loadDataset('golem_core_dataset.golem');
	});
	client.inspire.loadDataset('golem_core_dataset.golem');

	//WOW_SERVER
	if(cfg.get("loadwowserver")){
		var server = http.createServer(OnWorldMessage);
		OnDiscordMessage();
		server.listen(cfg.get("wow_server_port", "7790").toNumber());
	}
})
    .on('message', async (msg) => {
		if (!msg.author.bot) {
			last_channel = msg.channel;
			print(' [ '+msg.channel.name+' : '+msg.guild.name+' ] '+msg.author.tag+': '+msg.content, tag='say');
			com.process_commands(client, cfg, msg);

			if (msg.content.startsWith("+") && !msg.content.includes(" ") && cfg.get("ruqqus_autocomplete", "true") == "true"){
				msg.channel.send(`https://ruqqus.com/${msg.content}`);
			}


			//INSPIRE_FRAMEWORK
			if (client.inspire.golem.flags.autoparse == 'false') return;
			client.inspire.golem.output = function(m) {
				console.log('m '+m); if (m != undefined) msg.react('🤖');
			};
			client.inspire.message(msg.author.username, msg.content);
		}
    })
    .on('voiceStateUpdate', async function(before, after) {
      if (before.channel == null) return;
      if (before.member.id == client.user.id) return;
      if (before.channel.members.array().length == 1) {await before.channel.leave();}
    })
    /*.on('presenceUpdate', async function(before, after) {
      if (after.member.guild.id == '396716931962503169') {
        const r = client._config.get('recruit_records');
        const channel = after.member.guild.channels.cache.find((ch) => ch.name === 'botmasters-testzone');
        const recruit = after.member.roles.cache.find((ch) => ch.name === 'recruit');

        if (recruit != undefined && recruit != null) {
          if (!r.includes(after.member.id) && before.status != undefined && before.status == 'offline' && after.status == 'online') {
            channel.send(`monitor: ${after.user.username} has been seen.`);
            r.push(after.id);
            client._config.set('recruit_data', r);
          }
        }
      }
    })*/
    .on('messageReactionAdd', async function(reaction, user) {
		if (user.bot) return;

		//INSPIRE_FRAMEWORK
		if (reaction.emoji.name == '📱' || reaction.emoji.name == '🤖') {
			client.inspire.golem.output = function(m) {
				reaction.message.reply(m);
			};
			client.inspire.message(reaction.message.author.username, reaction.message.content);
		}
    })
    .on('messageReactionRemove', async function(reaction, user) {
		if (user.bot) return;


    })
    .on('disconnect', () => {process.exit(1);})
    .on('disconnected', () => {process.exit(1);})
    .on('reconnecting', () => {console.warn('Reconnecting...');})
    .on('error', console.error)
    .on('warn', console.warn);


//BEGIN_WOW_SERVER
function OnWorldMessage(request, response) {
    if (request.method != "POST") {
        response.writeHead(404);
        response.end();
        return;
    }

    try {
        let body = [];
        request.on('data', (chunk) => {
            body.push(chunk);
        }).on('end', () => {
            body = Buffer.concat(body).toString();
            var myJSON = JSON.parse(body);
            switch(cfg.get("wow_interations", "0"))
            {
                case "1":
                client.channels.cache.get(cfg.get("wow_channel")).send(myJSON.text);
                    break;
                case "0":
                    var string = "[" + myJSON.channel + "]" + " " + myJSON.text;
                    client.channels.cache.get(cfg.get("wow_channel")).send(string);
                    break;
            }

            response.writeHead(200);
            response.end();
        });
    }
    catch (e) {
        console.log(e);
        response.writeHead(500);
        response.end();
    }
}
function OnDiscordMessage() {
    client.on('message', async message => {
        if (message.author.bot) return;
        if (message.channel.type === "dm") return;
		let role = "GM";
        var gmLogo = "0";
        if(message.channel.id === cfg.get("wow_channel")){
            if(message.member.roles.find((ch) => ch.name === 'gm')) {gmLOGO = "1";}

            const messageArray = message.content;
            const author = message.member.user.username;
            const message_emoji_replace = emoji.replace(messageArray, (emoji) => `${emoji.key}`);
            let json_world = JSON.stringify({"senderName":author,"channelName":cfg.get("wow_channel_world"),"message": message_emoji_replace, "showGMLogo": gmLOGO});
            let json_world_a = JSON.stringify({"senderName":author,"channelName":cfg.get("wow_channel_world"),"message": message_emoji_replace, "showGMLogo": gmLOGO});
            let json_world_h = JSON.stringify({"senderName":author,"channelName":cfg.get("wow_channel_world"),"message": message_emoji_replace, "showGMLogo": gmLOGO});
            var auth = { 'Authorization': cfg.get("wow_token")};
            var url_0 = cfg.get("wow_post_url") + "0";
            var url_1 = cfg.get("wow_post_url") + "1";
			
            switch (cfg.get("wow_interations", "0")){
            case "1":
                request.post({url:url_0, form: json_world, headers: auth}, function(err, httpResponse,body)
							 {if(err) {console.log(err);}});
                request.post({url:url_1, form: json_world, headers: auth}, function(err, httpResponse,body)
							 {if(err) {console.log(err);}});
                break;
            case "0":
                
                request.post({url:config.post_url_server_message_alliance, form: json_world_a, headers: auth},
							 function(err, httpResponse,body){if(err) {console.log(err);}});
                
                request.post({url:config.post_url_server_message_horde, form: json_world_h, headers: auth},
							 function(err, httpResponse,body){if(err) {console.log(err);}});
                break;
            };
        };
    });
};
//END_WOW_SERVER


client.login(token);
