const Mongoose = require('mongoose');

const Schema = new Mongoose.Schema({
    discordId: {type: String, required: true},
    robloxId: {type: String, required: true},
    guildId: {type: String, required: true},
    starts: {type: String, required: true},
    ends: {type: String, required: true},
    reason: {type: String, required: true}
});

module.exports = new Mongoose.model('inactivitynotices', Schema);