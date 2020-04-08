const {docs} = require('./yggdrasil.js');
const lib = require('./common.js')
docs.lua.get(".sub", function(data) {
	if(data == undefined)console.log("undefined");
	if(data == "")console.log("empty");
	console.log(data[0])
	console.log(data[1].stripAll())
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
