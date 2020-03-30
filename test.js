const inspire = require('./inspire.js');

var e = new inspire.Markov();
/*
e.fromFile('/home/kaiz0r/Downloads/discord_dataset_2.txt');
e.name = "DiscordDataset";
e.description = "Dataset from discord chat.";
e.clean();
e.export('dataset.json');
*/
e.load('dataset.json');
