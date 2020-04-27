const {docs} = require('./yggdrasil.js');
const lib = require('./common.js')

/*
docs.lua.get("getmetatable", function(data) {
	if(data == undefined)console.log("undefined");
	if(data == "")console.log("empty");
	console.log(data)
	});*/


docs.gwiki.get("explode", function(data) {
	if(data == undefined)console.log("undefined");
	if(data == "")console.log("empty");
	console.log(data)
});

/*
var e = new inspire.Markov();

e.fromFile('/home/kaiz0r/Downloads/discord_dataset_2.txt');
e.name = "DiscordDataset";
e.description = "Dataset from discord chat.";
e.clean();
e.export('dataset.json');

e.load('dataset.json');
*/
