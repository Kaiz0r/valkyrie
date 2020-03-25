exports.isAdmin = function(ctx){
	return ctx.member.hasPermission('ADMINISTRATOR');
};

exports.isOwner = function(ctx){
	return ("206903283090980864" == ctx.member.id);	
};

exports.isWhitelisted = function(ctx){
	return ctx.cfg.get('whitelist', []).contains(ctx.member.id);	
};
