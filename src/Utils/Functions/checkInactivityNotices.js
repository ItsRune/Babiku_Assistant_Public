const Roblox = require('noblox.js');
const Client = require('../../Discord/index');
const inactivityNotices = require('../../Mongoose/InactivityNotices');
const Moment = require('moment');
const CreateEmbed = require('./CreateEmbed');
const getSettings = require('./getSettings');

async function checkInactivityNotices() {
    const Settings = getSettings();
    try {
        const notices = await inactivityNotices.find().exec();
        
        let requestedCount = 0;
        for (let i = 0; i < notices.length; i++) {
            const that = notices[i];
            const now = Moment().utc().valueOf();
            const theirEnd = Moment(Number(that.ends)).utc().valueOf();

            if (now > theirEnd) {
                if (requestedCount >= 9) {
                    requestedCount = 0;
                    setTimeout(this, 10000);
                    break;
                };

                try {
                    const guild = await Client.guilds.fetch(that.guildId);
                    const member = await guild.members.fetch(that.discordId);
                    const channel = await guild.channels.fetch('988905688199729185');
                    const userInformation = await Roblox.getPlayerInfo(that.robloxId);
                    const userRole = await Roblox.getRankNameInGroup(Settings.robloxGroupId, that.robloxId);

                    const toSendToThem = await CreateEmbed(member, `${Settings.Options.embedHeader} | Inactivity`, `Your inactivity notice has expired.`, null, null, null, null, null, null, null, {
                        dontSend: true
                    });

                    const toSendToHRChat = await CreateEmbed(
                        member, 
                        `${Settings.Options.embedHeader} | Inactivity`, 
                        `A player's inactivity notice has expired, they were notified and should be back to working shortly.
                        \nUser: ${member.user.username}#${member.user.discriminator}\nRoblox: [${userInformation.username} (${userRole})](https://roblox.com/users/${that.robloxId}/profile)`, 
                        null, null, null, null, null, null, null, {
                        dontSend: true
                    });

                    await inactivityNotices.deleteOne({ _id: that._id });
                    await member.send(toSendToThem);
                    await channel.send(toSendToHRChat);

                    requestedCount++;
                } catch(error) {
                    console.error(error);
                }
            };
        };
    } catch(error) {
        console.error(error);
    }
};

module.exports = checkInactivityNotices;