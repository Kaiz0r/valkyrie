const fs = require('fs');
var moment = require('moment');
const {execSync} = require('child_process');


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
String.prototype.lower = function() { return this.toLowerCase(); };
String.prototype.toNumber = function() { return Number(this); };
String.prototype.asTime = function() { return Number(this).asTime(); };
String.prototype.stripAll = function(alternate = "") {return this.replace(/(\r\n\t|\n|\r\t)/gm, alternate);};
String.prototype.replaceAll = function(searchStr, replaceStr) {
	var str = this;

    // no match exists in string?
    if(str.indexOf(searchStr) === -1) {
        // return string
        return str;
    }

    // replace and remove first match, and do another recursirve search/replace
    return (str.replace(searchStr, replaceStr)).replaceAll(searchStr, replaceStr);
}
Number.prototype.zp = function(n) { return this.toString().zp(n); };
Number.prototype.truncate = function(n){return Math.round(this * Math.pow(10, n)) / Math.pow(10, n);};
Number.prototype.as = function(def){ if (this == 0){return def;}else{return this;};};

Number.prototype.asTime = function(){
	let minutes = Math.floor(this / 60);
	let seconds = this - minutes * 60;
	if(minutes<10){minutes = `0${minutes}`;}
	if(seconds<10){seconds = `0${seconds}`;}
	return `${minutes}:${seconds}`;
};

exports.ProgressBar = function() {
	this.current = 0;
	this.limit = 10;
};

exports.ProgressBar.prototype.update = function(value){
	this.current = value;
	const pointer = (this.limit * (this.current / 100.0));
	const empty = Math.round(this.limit - pointer);

	return "◻".repeat(pointer)+"◼".repeat(empty);
};

exports.ProgressBar.prototype.show = function(){
	const pointer = (this.limit * (this.current / 100.0));
	const empty = Math.round(this.limit - pointer);

	return "◻".repeat(pointer)+"◼".repeat(empty);
};

exports.defaultNum = function(value){
	if(value == undefined) return 0;
	return value;
};
global.defaultNum = function(value){return exports.defaultNum(value);};

exports.Talkfilters = {
	valid: ['austro', 'b1ff', 'brooklyn', 'chef', 'cockney', 'drawl', 'dubya', 'fudd', 'funetak', 'jethro', 'jive', 'kraut', 'pansy', 'pirate', 'postmodern', 'redneck', 'valspeak', 'warez'],
	run: function(filter, text){
		if(this.valid.includes(filter)){
			const out = exports.execute(`echo "${text}"|${filter}`);
			console.log(`out ${out} (${typeof(out)})`);

			return out;
		}
		return `Filter ${filter} not in list.`;
	}
};
exports.execute = function(command, callback){
    //exec(command, function(error, stdout, stderr){ callback(stdout); });
	return execSync(command, { encoding: 'utf8'}).toString();
};

exports.ssplit = function(s){
	var myRegexp = /[^\s"]+|"([^"]*)"/gi;
	var myArray = [];

	do {
		var match = myRegexp.exec(s);
		if (match != null)
		{
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
	let ts = "";
	let stag = "";
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
};

global.echo = function(msg, ...args) {console.log(msg, ...args);};

exports.isArray = function(a) {
    return (!!a) && (a.constructor === Array);
};

exports.isObject = function(a) {
    return (!!a) && (a.constructor === Object);
};

global.isArray = function(a) {
    return exports.isArray(a);
};

global.isObject = function(a) {
    return exports.isObject(a);
};
