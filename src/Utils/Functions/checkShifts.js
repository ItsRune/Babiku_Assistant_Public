const Moment = require('moment');
const verifModel = require('../../Mongoose/Verification');
const Client = require('../../Discord/index');
const getSettings = require('./getSettings');

async function checkShifts() {
    try {
        const Settings = getSettings();
        const verifications = await verifModel.find({});
        const now = Moment().utc().unix() + 600; // 10 minutes in the future

        verifications.forEach(async (that) => {
            if (Object.keys(that.data).length > 0 && Object.keys(that.data).indexOf('Shifts') != -1 && that.data.Shifts.length > 0) {
                const shifts = that.data.Shifts;
                let dataHolder = that.data;
                let newShifts = shifts;
                let removedShifts = [];

                for (let j = 0; j < shifts.length; j++) {
                    const shift = shifts[j];

                    if (
                        (shift.preferredTime > now && shift.preferredTime > shift.preferredTime + 1800) && shift.isOnGoing === false ||
                        (shift.preferredTime > now && shift.preferredTime > shift.preferredTime + 7200)
                        ) {
                        removedShifts.push(shift);
                        newShifts = newShifts.splice(j + 1, 1);
                    };
                };

                dataHolder.Shifts = newShifts;
                if (newShifts.length != shifts.length) {
                    await verifModel.updateOne({ robloxId: that.robloxId }, { $set: { data: dataHolder } });
                };

                if (removedShifts.length > 0) {
                    for (const i in removedShifts) {
                        try {
                            const Channel = await Client.channels.fetch(Settings.Options.AnnouncementChannels.Shift);
                            const Message = await Channel.messages.fetch(removedShifts[i].messageId);
    
                            Message.delete();
                        } catch(error) {}; // Lazy.
                    };
                };
            };
        });
    } catch(error) {
        console.error(error);
    }
};

module.exports = checkShifts;