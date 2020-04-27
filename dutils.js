const moment = require("moment");

global.getGuildChannel = function(guild, name){
	for (const chan of guild.channels.cache){
		const u = chan[1];
		if (u.name == name || u.id == name){
			return u;
		}
	}
	return undefined;
};

global.findGuildChannel = function(guild, name){
	for (const chan of guild.channels.cache){
		const u = chan[1];
		if (u.name.lower().includes(name.lower()) || u.name.lower() == name.lower() || u.id == name){
			return u;
		}
	}
	return undefined;
};

global.getChannel = function(client, name){
	for (const chan of client.channels.cache){
		const u = chan[1];
		if (u.name == name || u.id == name){
			return u;
		}
	}
	return undefined;
};

global.findChannel = function(client, name){
	for (const chan of client.channels.cache){
		const u = chan[1];
		if (u.name.lower().includes(name.lower()) || u.name.lower() == name.lower() || u.id == name){
			return u;
		}
	}
	return undefined;
};

global.getGuild = function(client, name){
	for (const guild of client.guilds.cache){
		const u = guild[1];
		if (u.name == name || u.id == name){
			return u;
		}
	}
	return undefined;
};

global.findGuild = function(client, name){
	for (const guild of client.guilds.cache){
		const u = guild[1];
		if (u.name.lower().includes(name.lower()) || u.name.lower() == name.lower() || u.id == name){
			return u;
		}
	}
	return undefined;
};

global.getRole = function(guild, name){
	for (const role of guild.roles.cache){
		const u = role[1];
		if (u.name == name || u.id == name){
			return u;
		}
	}
	return undefined;
};

global.findRole = function(guild, name){
	for (const role of guild.roles.cache){
		const u = role[1];
		if (u.name.lower().includes(name.lower()) || u.name.lower() == name.lower() || u.id == name){
			return u;
		}
	}
	return undefined;
};

global.getMember = function(guild, name){
	for (const user of guild.members.cache){
		const u = user[1];
		if (u.nickname == name || u.id == name || u.user.username == name){
			return u;
		}
	}
	return undefined;
};

global.findMember = function(guild, name){
	for (const user of guild.members.cache){
		const u = user[1];
		if ((u.nickname && u.nickname.toLowerCase().includes(name.toLowerCase())) || u.nickname == name || u.user.username.toLowerCase().includes(name.toLowerCase()) || u.user.username == name || u.id == name){
			return u;
		}
	}
	return undefined;
};

global.getUser = function(client, name){
	for (const user of client.users.cache){
		const u = user[1];
		if (u.username == name || u.id == name){
			return u;
		}
	}
	return undefined;
};

global.getUser = function(client, name){
	for (const user of client.users.cache){
		const u = user[1];
		if (u.username.lower().includes(name.lower()) ||u.username.lower() == name.lower() || u.id == name){
			return u;
		}
	}
	return undefined;
};

global.getMemberAge = function(user, fmt){
	if(fmt == undefined) fmt = "s";
	const now = moment();
	const joined = moment(user.joinedAt);

	return now.diff(joined, fmt);
};

global.getUserAge = function(user, fmt){
	if(fmt == undefined) fmt = "s";
	const now = moment();
	const joined = moment(user.createdAt);

	return now.diff(joined, fmt);
};

global.timeSince = function(time, fmt){
	if(fmt == undefined) fmt = "s";
	const now = moment();
	const then = moment(time);

	return now.diff(then, fmt);
};
