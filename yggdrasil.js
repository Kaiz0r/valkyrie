var needle = require('needle');
const cheerio = require('cheerio');
const fs = require('fs');
const os = require('os');
const lib = require('./common.js');

exports.path = `${os.homedir()}/.yggdrasil/`;

function searchKeys(data, key){
	let out = [];
	for (const v of Object.keys(data)){
		if(v.includes(key)){
			out.push([v, data[v]]);
		}
	}
	return out;
}

function writeTree(lang, rawdata){
	if(!fs.existsSync(exports.path)){
		 fs.mkdirSync(exports.path);
	}
	let data = JSON.stringify(rawdata, null, 2);
	fs.writeFile(exports.path+lang+".json", data, (err) => {
		if (err) throw err;
			console.log('Data written to file');
	});
}

exports.docs = {};

exports.docs.python = {
	name: "Python",
	version: "3.x",
	url: "https://docs.python.org/3/index.html",
	index: "https://docs.python.org/3/contents.html",
	extra: {"alternate_index": "https://docs.python.org/3/genindex-all.html"},
	data: {}
};

exports.docs.lua = {
	name: "Lua",
	version: "5.1",
	url: "https://www.lua.org/manual/5.1/",
	index: "https://www.lua.org/manual/5.1/manual.html",
	data: {}
};

exports.docs.lua.get = async function(search, callback){
	if(fs.existsSync(`${exports.path}lua.json`)){
		let rawdata = fs.readFileSync(`${exports.path}lua.json`);
		callback(searchKeys(JSON.parse(rawdata), search));  		
	}else{	
		needle.get(this.index, function(error, response) {
			let data = {};
			if (!error && response.statusCode == 200){ 
				let sect = response.body.split("\n\n\n\n");
				for (let i = 0; i < sect.length; i++) {
					let $ = cheerio.load(sect[i]);
					let head = $("h3").text();
					let body = $.root().text().trim();
					body = body.split("\n");
					_ = body.shift();
					body = body.join("\n");

					if(head != ""){data[head] = body;}
				}
				writeTree("lua", data);
				callback(searchKeys(data, search)); 
			}
			else
				callback({});
		});
	}
};

exports.docs.js = {
	name: "Javascript",
	version: "ECMA 5.1+",
	url: "https://developer.mozilla.org/en-US/docs/Web/javascript",
	index: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference",
	data: {}
};

exports.docs.node = {
	name: "Node.js",
	version: "13.x",
	url: "https://nodejs.org/en/docs/",
	index: "https://nodejs.org/dist/latest-v13.x/docs/api/all.html",
	data: {}
};

exports.docs.nim = {
	name: "Nim",
	version: "1.2.0",
	url: "https://nim-lang.org/docs/lib.html",
	index: "https://nim-lang.org/docs/theindex.html",
	data: {}
};

exports.docs.twsg = {
	name: "Sugarcube (Twine)",
	version: "*",
	url: "https://www.motoslave.net/sugarcube/2/docs/",
	extra: {tweego: "https://www.motoslave.net/tweego/docs/"},
	data: {}
};

exports.docs.gwiki = {
	name: "GLua Wiki",
	version: "*",
	url: "https://wiki.facepunch.com/gmod/",
	index: "https://metastruct.github.io/gmod-wiki-scraper/gwiki.json",
	data: {}
};

exports.docs.gwiki.get = async function(search, callback){
	let continueproc = true;
	if(!fs.existsSync(`${exports.path}gwiki.json`)){
		console.log("Creating gwiki.json")
		needle.get(this.index, function(error, response) {
			let data = {};
			if (!error && response.statusCode == 200){
				if(!fs.existsSync(exports.path)){
					fs.mkdirSync(exports.path);
				}
				let data = JSON.stringify(response.body, null, 2);
				fs.writeFile(exports.path+"gwiki.json", data, (err) => {
					if (err) throw err;
					console.log('Data written to file');
				});				
			}
		});
	}
	
	let d = JSON.parse(fs.readFileSync(`${exports.path}gwiki.json`));
	let out = [];
	let master = null;
	if (search.includes(".")){master = search.split(".")[0]; search = search.split(".")[1];}
	const checkMaster = function(inp){
		if (master == null) return true;
		if (inp.lower().includes(master.lower())) return true;
		return false;
	};
	
	for (let i = 0; i < d.length; i++) {
		let ob = d[i];
		//console.log(ob)
		if(ob.function != undefined){
			if(ob.function.name.lower().includes(search.lower()) && checkMaster(ob.function.parent)) out.push(ob);
		}else if(ob.enum != undefined && lib.isObject(ob.enum)){
			if( (typeof(ob.enum.description) == String && ob.enum.description.lower().includes(search.lower())) || (ob.enum.description.text != undefined && ob.enum.description.text.lower().includes(search.lower())) )
				out.push(ob);
		}else if(ob.enum != undefined && lib.isArray(ob.enum)){
			for (let i = 0; i < ob.enum.length; i++) {
				let en = ob.enum[i];		
				if( (typeof(en.description) == String && en.description.lower().includes(search.lower())) || (en.description.text != undefined && en.description.text.lower().includes(search.lower())) )
					out.push(en);
			}
		}
	}
	
	callback(out);

};
