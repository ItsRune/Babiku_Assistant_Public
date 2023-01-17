const Roblox = require('noblox.js');
const Moment = require('moment-timezone');
const Client = require('../../Discord/index');
const shiftData = require('../../Mongoose/Shift');
const { getCurrentWeek, setCurrentWeek } = require('../../Utils/Functions/getCurrentWeek');

async function checkShiftAttendance() {
    try {
        const currentWeekTime = (getCurrentWeek()).start;
        const shift = await shiftData.find({ startWeek: currentWeekTime });
        const now = Moment().unix();

        if (now >= shift.endWeek) {
            const newShiftWeek = Moment().tz('America/New_York').hours(23).minutes(59).seconds(59).add(1, 'week').unix();
            const newShiftStart = Moment().tz('America/New_York').hours(0).minutes(0).seconds(0).unix();

            new shiftData({
                startWeek: newShiftStart,
                endWeek: newShiftWeek
            }).save();

            setCurrentWeek(newShiftStart);
        }
    } catch(error) {
        console.error(error);
    };
};

module.exports = checkShiftAttendance;