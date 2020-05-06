const fs = require('fs');
var Classifier = require( 'wink-naive-bayes-text-classifier' );
var nlp = require( 'wink-nlp-utils' );
var ner = require( 'wink-ner' );
var winkTokenizer = require( 'wink-tokenizer' );
var common = require('./common.js');

exports.Persona = function(){
	this.mood = 0;
	this.stress = 0;
};

exports.Persona.prototype.increaseMood = function(incr){
	this.mood += incr;
	if (this.mood > 100){this.mood = 100;}
};

exports.Persona.prototype.decreaseMood = function(incr){
	this.mood -= incr;
	if (this.mood < 100){this.mood = 100;}
};

exports.Persona.prototype.increaseStress = function(incr){
	this.stress += incr;
	if (this.mood > 10){this.mood = 10;}
};

exports.Persona.prototype.decreaseStress = function(incr){
	this.stress -= incr;
	if (this.stress < -10){this.stress = -10;}
};

exports.Persona.prototype.evaluateEmotion = function(){};

exports.Golem = function(){
	this.commands = {};
	this.flags = {};
	this.setVar("debug", "true");
	this.output = function(message){console.log(this.handleVariables(message));};
	this.error = function(message){console.log("ERROR: "+message);};
	this.debug = function(message){if(this.flags.debug != "true") return; console.log("DEBUG: "+message);};
	this.fallback = function(g, message){g.output(message);};
	
	this.commands["set"] = function(g, message){
		if (message.includes("to")){
			let m = message.split(" to ");
			let key = m.shift();
			let val = m.join(" ");
			g.flags[key] = val;
		}else if(!message.includes(" = ")){
			let m = message.split(" = ");
			let key = m.shift();
			let val = m.join(" ");
			g.flags[key] = val;
		}else{return;}
	};

	this.commands["echo"] = function(g, message){
		g.output(message);
	};
	this.commands["include"] = function(g, message){
		g.parseFile(message);
	};
};

exports.Golem.prototype.setVar = function(key, value){
	this.flags[key] = value.toString();
};

exports.Golem.prototype.addCommand = function(name, callback){
	this.commands[name] = callback;
};

exports.Golem.prototype.handleVariables = function(input){
	let out = [];
	const clean = function(g, i){
		let out = i;
		let invFound = "";
		const invalid = [',', '.', '!', '?'];
		
		for (const o of invalid){
			if(out.endsWith(o)){out = out.replace(o,'');invFound = o;}
		}
		
		if(out.startsWith("$") && g.flags[out.replace("$", "")] != undefined){
				out = g.flags[out.replace("$", "")];
		}
		return out+invFound;
	};
	
	for (const partp of input.split(" ")){
		const part = clean(this, partp);
		if(part.startsWith("$")){
			if(this.flags[part.replace("$", "")] != undefined){
				out.push(part.replace(part, this.flags[part.replace("$", "")]));
			}else{
				out.push(part);
			}
		}else{out.push(part);}
	}
	return out.join(" ");
};

exports.Golem.prototype.parse = function(input){
	if(input == ""){return;}
	this.debug("Parsing "+input);
	if(input.includes(":::")){
		for (const part of input.split(":::")){
			this.parse(part);
		}
		
	}else{
		let c = input.split(" ");
		let command = c.shift();
		let message = this.handleVariables(c.join(" "));
		if(this.commands[command] != undefined){this.commands[command](this, message);}else{this.fallback(this, command+" "+message);}
	}
};

exports.Golem.prototype.parseFile = function(path){
	let atEnd = [];
	let cont = [];
	let doContinue = false;
	let rawdata = fs.readFileSync(path);
	let lines = rawdata.toString().split("\n");
	
	for (const line of lines){
		if(doContinue){
			if(line == "--#"){
				doContinue = false;
				this.parse(cont.join(" ").replaceAll("#n", "\n").replaceAll("#t", '\t'));
				console.log("Ending continue: "+cont.join(" ").replace("#n", "\n").replace("#t", '\t'));
			}
			else{
				if(line.startsWith("#@ ")){
					this.parse(line.replace("#@ ", ''));
				}else cont.push(line);
			}
		}else if(line.startsWith("& ")){
			atEnd.push(line.replace("& ", ''));
		}else{
			if(line.endsWith("#--")){
				cont = [line.slice(0, -3)];
				doContinue = true;
			}else{
				this.parse(line);
			}
		}
	}

	let u = [...new Set(atEnd)];
	for(const l of u){
		this.parse(l);
	}
};

exports.SessionManager = function(){
	this.sessions = {};
};
exports.SessionManager.prototype.get = function(name){
	if(this.sessions[name] == undefined){
		console.log("New session created for "+name);
		this.sessions[name] = {};
	}

	return this.sessions[name];
};

exports.Inspire = function(name = "Golem"){
	// SETTINGS
	this.bot_name = function(){return this.golem.flags["name"];};
	this.name = function(){return this.golem.flags["name"];};;
	this.silentOnFail = true;
	this.vdebug = true;

	// CALLS
	this.persona = new exports.Persona();
	this.golem = new exports.Golem();
	this.golem.flags["name"] = name;
	this.sessions = new exports.SessionManager();
	this.golem.inspiration = this;
	this.golem.ner = ner();
	
	this.golem.tokenize = winkTokenizer().tokenize;
	this.golem.nbc = Classifier();
	this.golem.nbc.definePrepTasks( [nlp.string.tokenize0, nlp.tokens.removeWords, nlp.tokens.stem] );
	this.golem.nbc.defineConfig( { considerOnlyPresence: true, smoothingFactor: 0.5 } );

	this.golem.replies = {};
	this.golem.fallback = function(g, message){g.output("Not understood.");};

	//Teach is a reply for an intent
	// reply helphx I see you need help with HX.
	//       ^ name ^ response
	// Adds to object of responses for input to check against
	this.golem.addCommand("reply", function(g, message){ 
		let n = message.split(" ");
		const subject = n.shift();
		const m = n.join(" ");
		g.debug(g.inspiration.bot_name()+": new reply: "+subject+" | "+m);
		g.replies[subject] = m; 
	});

	//Add training data for named entity recognition
	// train deus ex | game | deusex
	//       ^ text    ^ type ^ ID (optional)
	this.golem.addCommand("train", function(g, message){
		g.debug(g.inspiration.bot_name+" will train: "+message);
	});
	
	this.golem.addCommand("get", function(g, message){
		g.debug(message);
		let intent = g.nbc.predict(message);
		g.debug(intent);
		if (g.replies[intent] != undefined){
			g.output(g.handleVariables(g.replies[intent]));
		}
	});

	this.golem.addCommand("!finalize", function(g, message){
		g.debug("Finalizing...");
		g.nbc.consolidate();
	});
	
	this.golem.addCommand("understand", function(g, message){
		g.debug("Attempting to understand: "+message);
		let p = message.split();
		let sender_id = message.split("from_input|")[1].split("|")[0];
		let msg = message.replace(`from_input|${sender_id}| `, '');
		msg = msg.replace(`from_input|${sender_id}|`, '');
		let session = g.inspiration.sessions.get(sender_id);
		g.parse(`get ${msg}`);
	});
	
	//Feeds a learning statement for a subject
	// learn helphx I need help with HX
	//       ^ name ^ example input
	this.golem.addCommand("learn", function(g, message){
		let n = message.split(" ");
		const subject = n.shift();
		const m = n.join(" ");
		g.debug("LEARN: "+subject+" | "+m);
		g.nbc.learn( m, subject );
	});
};

exports.Inspire.prototype.tokenize = function(input){
	var tokens = this.golem.tokenize( input );
	return this.golem.ner.recognize( tokens );
};

// Feed it a golem readable file which will run through and learn a default dataset
exports.Inspire.prototype.loadDataset = function(path){
	this.golem.parseFile(path);
};

exports.Inspire.prototype.cleanSessionName = function(n){
	return n.replace(" ", "");
};

exports.Inspire.prototype.message = function(sender_id, input){
	this.golem.parse(`understand from_input|${this.cleanSessionName(sender_id)}| ${input}`);
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
