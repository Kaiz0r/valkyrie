//const {docs} = require('./yggdrasil.js');
//const lib = require('./common.js')

/*
docs.lua.get("getmetatable", function(data) {
	if(data == undefined)console.log("undefined");
	if(data == "")console.log("empty");
	console.log(data)
	});*/


/*docs.gwiki.get("explode", function(data) {
	if(data == undefined)console.log("undefined");
	if(data == "")console.log("empty");
	console.log(data)
});*/

/*
var e = new inspire.Markov();

e.fromFile('/home/kaiz0r/Downloads/discord_dataset_2.txt');
e.name = "DiscordDataset";
e.description = "Dataset from discord chat.";
e.clean();
e.export('dataset.json');

e.load('dataset.json');
*/

const inspire = require("./inspire.js");
var i = new inspire.Inspire();
i.golem.output = function(m){console.log(i.name()+"> "+m);};
i.loadDataset("golem_core_dataset.golem");
//i.message("Kaiser", "i need help with HX mod");
//i.message("Kaiser", "is kenties any good, im looking for a new launcher");
//i.message("Kaiser", "i need help, hx crashes");
i.message("Kaiser", "how do i host a server");

/*i.message("Kaiser", "set f to tvar:::set t to fvar");
i.message("Kaiser", "echo the value of `f` is $f");
i.message("Kaiser", "learn x is a dude");
i.message("Kaiser", "say what is ex?");
i.message("Kaiser", "but what is f again? oh right, $f:::and t is $t");*/
