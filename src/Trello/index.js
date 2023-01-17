const Trello = require('trello');
const Settings = require('../../Settings.json');
const Client = new Trello(Settings.Trello_ApiKey, Settings.Trello_ApiToken);

module.exports = Client;