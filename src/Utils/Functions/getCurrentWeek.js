const Moment = require('moment-timezone');
const path = require('path');
const fs = require('fs');
const Client = require('../../Discord/index');
const shiftModel = require('../../Mongoose/Shift');
const getSettings = require('./getSettings');
const CreateEmbed = require('./CreateEmbed');

function getCurrentWeek() {
    const start = fs.readFileSync(path.join(__dirname, '../../Files/currentWeekStart.txt'), 'utf-8');
    const now = Moment(start * 1000).add(1, "week").tz("America/New_York").unix();

    return { start, later: now };
};

function setCurrentWeek(weekVal) {
    fs.writeFileSync(path.join(__dirname, '../../Files/currentWeekStart.txt'), String(weekVal), 'utf-8');
}

async function checkCurrentWeek() {
    const Settings = getSettings();
    const now = Moment().tz("America/New_York").unix() / 1000;
    const currentWeek = getCurrentWeek();
    const later = Moment(currentWeek.later).tz("America/New_York").unix();
    
    try {
        const currentWeekData = (await shiftModel.find({ startWeek: currentWeek.start }))[0];
        
        if (now >= later) {
            if (!currentWeekData.data) return;
            if (Object.keys(currentWeekData.data).length > 0) {
                const options = [
                    {
                        Label: "Restaurant",
                        Value: "restaurant",
                        Description: "Shows the player's who attended trainings this week."
                    },
                    {
                        Label: "Trainings",
                        Value: "trainings",
                        Description: "Shows the player's who attended trainings this week."
                    }
                ];
                
                try {
                    const Channel = await Client.channels.fetch(Settings.Options.AnnouncementChannels.WeeklyShiftReset);

                    await CreateEmbed(Channel, `Weekly Shift Reset`, `Select below to see which users have been active at shifts.`, null, null, null, null, null, null, {
                        Placeholder: "Select which shift type to look at.",
                        ID: `weeklyShiftReset_${currentWeek.start}_${Moment().tz("America/New_York").add(1, "month").unix()}`,
                        maxValues: 1,
                        Options: options
                    }, {
                        useMenuV2: true
                    });
                } catch(error) {
                    console.error(error);
                };
            };

            const newWeek = Moment().tz("America/New_York").hours(23).minutes(59).seconds(59).add(1, 'week').unix();
            const newStart = Moment().tz("America/New_York").hours(0).minutes(0).seconds(0).unix();
    
            await shiftModel.create({
                startWeek: newStart,
                endWeek: newWeek
            });
    
            setCurrentWeek(newStart);
        };
    } catch(error) {
        console.error(error);
    }
};

module.exports = {
    getCurrentWeek,
    setCurrentWeek,
    checkCurrentWeek
};