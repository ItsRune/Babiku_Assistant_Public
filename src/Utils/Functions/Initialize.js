const Roblox = require('noblox.js');
const Mongoose = require('mongoose');
const Client = require('../../Discord/index');
const addCommands = require('./addCommands');
const addEvents = require('./addEvents');
const Settings = require('../../../Settings.json');
const App = require('../../Express/index');
const Sleep = require('./Sleep');

async function Initialize() {
  try {
    await Roblox.setCookie(Settings.Roblox_Token);
  } catch(error) {
    console.error(`Roblox Error: ${error.message}`);
  };

  try {
    await Mongoose.connect(Settings.MongooseUri);
  } catch(error) {
    console.error(`Mongoose Error: ${error.message}`);
  };

  try {
    await App.listen(process.env.PORT || 80, () => console.log(`Application is online.`));
  } catch(error) {
    console.error(`Express Error: ${error.message}`);
  };
  
  try {
    await addCommands(Client, '../../Discord/Commands');
    await addEvents(Client, '../../Discord/Events');
    await Sleep(250);
    
    await Client.login((Settings.Debug === true) ? Settings.Debug_Discord_Token : Settings.Discord_Token);
  } catch(err) {
    console.error(`Discord Error: ${err.message}`);
  };
};

module.exports = Initialize;