const fs = require('fs');
var methods = {};
var moment = require('moment');

(function(){

var fnProto = Function.prototype,
	docString = function(){
		var doc = this[this.toSource ? 'toSource' : 'toString']().match(/['"]\*(.*)\*['"]/);
		return (doc) ? doc[1].replace(/^\s+|\s+$/g, '') : '';
	};

if (Object.defineProperty) Object.defineProperty(fnProto, 'docString', {get: docString});
else if (fnProto.__defineGetter__) fnProto.__defineGetter__('docString', docString);
else fnProto.docString = '';
})();

Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};
Array.prototype.cut = function(target){	this.splice (this.indexOf(target), 1); };
String.prototype.ssplit = function() { return exports.ssplit(this); };
String.prototype.zp = function(n) { return '0'.times(n - this.length) + this; };
String.prototype.reverse = function() { return this.split('').reverse().join(''); };
Number.prototype.zp = function(n) { return this.toString().zp(n); };
Number.prototype.truncate = function(n){return Math.round(this * Math.pow(10, n)) / Math.pow(10, n);};

exports.ssplit = function(s){
	var myRegexp = /[^\s"]+|"([^"]*)"/gi;
	var myArray = [];

	do {
		//Each call to exec returns the next regex match as an array
		var match = myRegexp.exec(s);
		if (match != null)
		{
			//Index 1 in the array is the captured group if it exists
			//Index 0 is the matched text, which we use if no captured group exists
			myArray.push(match[1] ? match[1] : match[0]);
		}
	} while (match != null);
	
	return myArray;
};

exports.ConfigManager = function(path){
	if (path == undefined){ this.path = "config.json"; }
	this.data = {};
	this.read();
	
};

exports.ConfigManager.prototype.set = function(key, value){
	this.data[key] = value;
	this.write();
};

exports.ConfigManager.prototype.get = function(key, defaultValue){
	if (this.data[key] == undefined){
		this.data[key] = defaultValue;
	}
	return this.data[key];
};

exports.ConfigManager.prototype.read = function(){
	let rawdata = fs.readFileSync(this.path);
	
	this.data = JSON.parse(rawdata);
	return this.data;  
};

exports.ConfigManager.prototype.write = function(){
	let data = JSON.stringify(this.data, null, 2);
	fs.writeFile(this.path, data, (err) => {
		if (err) throw err;
			console.log('Data written to file');
	});
};

exports.wrap = function(msg, wrapper){
	if (wrapper == undefined) { wrapper = "```"; }
	return "```\n"+msg+"\n```";
};

exports.code = function(msg, lang){
	if (lang == undefined) { lang = ""; }
	return "```"+lang+"\n"+msg+"\n```";
};

exports.space = function(base, count, next){
	count -= base.length;
	if(count < 0){count = 5;}
	const pre = " ".repeat(count);
	return pre+next;
};

exports.print = function(message, tag="none", timestamp=true){
	ts = "";
	if (timestamp){
		ts = moment().format('MM-D-YYYY HH:mm:ss')+" | ";
	}
	
	if (tag == "say"){
		stag = "[SAY]".yellow;
		console.log(ts+" "+stag+" | "+message);
	}else if(tag == "info"){
		stag = "[INF]".white;
		console.log(ts+" "+stag+" | "+message);
	}else if(tag == "warn"){
		stag = "[WAR]".red;
		console.log(ts+" "+stag+" | "+message);
	}else{
		console.log(ts+message);
	}
}
