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

exports.WeatherAPI = function(apikey){
	this.apikey = apikey;
};

exports.WeatherAPI.prototype.send = function(endpoint, params, callback){
	let url = `http://api.weatherapi.com/v1/${endpoint}.json?key=${this.apikey}&${params}`;
	//console.log(url);
	needle.get(url,
			   function(error, response) {
				   if (!error && response.statusCode == 200){
					   //console.log(response.body);
					   callback( response.body);
			   }
				   else
					   callback({});
			   });
};

exports.WeatherAPI.prototype.atronomy = async function(search, callback){
	this.send('astronomy', `q=${search.replace(" ", "+")}&dt=`, function(body){callback(body);});
};

exports.WeatherAPI.prototype.current = async function(search, callback){
	
	this.send('current', `q=${search.replace(" ", "+")}`, function(data){callback(data);});
	
};

exports.WeatherAPI.prototype.forecast = async function(search, days, callback){
	if(days == undefined) days = "7";
	this.send('forecast', `q=${search.replace(" ", "+")}&days=${days}`, function(body){callback(body);});
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
