var needle = require('needle');
const cheerio = require('cheerio');
const fs = require('fs');
const os = require('os');
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
				let sect = response.body.split("\n\n");
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
