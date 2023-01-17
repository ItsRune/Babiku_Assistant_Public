const Moment = require('moment-timezone');
const Mongoose = require('mongoose');

const Schema = new Mongoose.Schema({
    data: {type: Mongoose.Schema.Types.Mixed, default: {}},
    startWeek: {type: Number, default: Moment().tz('America/New_York').hours(0).minutes(0).seconds(0).unix()},
    endWeek: {type: Number, default: Moment().tz('America/New_York').hours(23).minutes(59).seconds(59).add(1, 'week').unix()},
});

module.exports = new Mongoose.model('shifts', Schema);