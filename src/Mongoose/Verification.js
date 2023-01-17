const Moment = require('moment-timezone');
const Mongoose = require('mongoose');

const Schema = new Mongoose.Schema({
    robloxId: {type: Number, required: true},
    discordId: {type: String, required: true},
    verifiedAt: {type: String, default: `${Moment().tz('America/New_York').format("MMMM Do YYYY, h:mm:ss a")} EST`},
    data: {type: Mongoose.Schema.Types.Mixed, default: {}}
});

module.exports = new Mongoose.model('verifications', Schema);