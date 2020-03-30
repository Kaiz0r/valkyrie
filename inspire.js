const fs = require('fs');

exports.Persona = function(){
	this.mood = 0;
	this.stress = 0;
};

exports.Persona.increaseMood = function(incr){
	this.mood += incr;
	if (this.mood > 100){this.mood = 100;}
};

exports.Persona.decreaseMood = function(incr){
	this.mood -= incr;
	if (this.mood < 100){this.mood = 100;}
};

exports.Persona.increaseStress = function(incr){
	this.stress += incr;
	if (this.mood > 10){this.mood = 10;}
};

exports.Persona.decreaseStress = function(incr){
	this.stress -= incr;
	if (this.stress < -10){this.stress = -10;}
};

exports.Persona.evaluate = function(){
	
};

exports.Inspiration = function(){
	this.persona = new exports.Persona();
};



exports.Markov = function(){
	this.name = "undefined";
	this.description = "undefined";
	this.lines = [];
	this.cacheSize = 3;
	this.dataset = "";
};

exports.Markov.prototype.clean = function(){
	const nl = this.lines;
	var f = [];
	for (const line of this.lines){
		if (line != "" && line.split(" ").length > this.cacheSize){f.push(line);}
	}
	this.lines = f;
};

exports.Markov.prototype.write = function(line){
	this.lines.push(line);
};

exports.Markov.prototype.export = function(path){
	var real_path = "";
	if (path != undefined){real_path = path;}else{ real_path = this.dataset; }
	console.log(real_path);
	let f = JSON.stringify({"cacheSize": this.cacheSize, "lines": this.lines, "name": this.name, "description": this.description}, null, 2);
	fs.writeFile(real_path, f, (err) => {
		if (err) throw err;
			console.log('Data written to file');
	});
};

exports.Markov.prototype.fromFile = function(path){
	this.dataset = path;
	this.read(fs.readFileSync(path, 'utf-8'));
};

exports.Markov.prototype.load = function(path){
	const data = JSON.parse(fs.readFileSync(path));
	this.name = data.name;
	this.description = data.description;
	this.lines = data.lines;
	this.dataset = path;
	this.cacheSize = data.cacheSize;
};

exports.Markov.prototype.read = function(body){
	this.lines = body.split("\n");
};

exports.Markov.prototype.buildCache = function(start){
	for (const line of this.lines){
		
	}
};

function continueStr(start){
	
}

exports.Markov.prototype.generate = function(start){
	if (this.cache.length == 0){
		this.buildCache();
	}
	if (start == undefined){
		
	}else{
		
	}
};
