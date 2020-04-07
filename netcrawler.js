var needle = require('needle');
const cheerio = require('cheerio');

exports.Whois = async function(ip, callback){
	needle.get(`https://rest.db.ripe.net/search.json?query-string=${ip}&flags=no-filtering&source=RIPE`,
			   function(error, response) {
				   if (!error && response.statusCode == 200)
					   callback(response.body);
				   else
					   callback({});
			   });
};

exports.Covid = async function(callback){
	needle.get('https://coronadatascraper.com/data.json', function(error, response) {
		console.log("Getting covid...");
		if (!error && response.statusCode == 200)
			//console.log(response.body)
			callback(response.body);
		else
			callback({});
	});
};

exports.DuckDuckGo = function(){
	this.cache = {};
};

exports.DuckDuckGo.prototype.search = function(term){

};

exports.DuckDuckGo.prototype.quick = function(term){

};

exports.DuckDuckGo.prototype.infobox = function(term){

};

exports.Startpage = function(){
	this.cache = {};
};

exports.Startpage.prototype.search = function(term){

};

exports.Startpage.prototype.images = function(term){

};

exports.Startpage.prototype.quick = function(term){

};
