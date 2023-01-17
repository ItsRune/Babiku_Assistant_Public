const Client = require('../../Discord/index');
const Roblox = require('noblox.js');
const CreateEmbed = require('./CreateEmbed');
const OpenCloud = require('@itsrune/opencloud.js');
const getSettings = require('./getSettings');
const formatTime = require('./formatTime');

async function getFailedSentApps() {
    const Settings = getSettings();
    const Universe = new OpenCloud(2447460400, Settings.robloxApiKey);

    try {
        const DataStore = Universe.DataStoreService.GetDataStore("Backup_Apps");
        const data = (await DataStore.GetAsync("ADMIN"));
        const parsed = (data.data && (String(data.data).substring(0, 1) == "[" && String(data.data).substring(1, 2) == "{")) ? JSON.parse(data.data) : [];
        if (!parsed) return;

        let newData = parsed;
        let resolved = false;

        for (const i in parsed) {
            let dataToSend = parsed[i];
            let outOf = 0;
            let correct = 0;
            let fields = [];
            let user = null;

            const Answers = dataToSend.Answers;
            const theirAnswers = dataToSend.App;
            const userId = dataToSend.UserId;
            const appKeys = Object.keys(theirAnswers);
            
            try {
                user = await Roblox.getPlayerInfo(userId);
            } catch(error) {
                console.log(error);
            };

            for (const i in appKeys) {
                const question = appKeys[i];
                const isMultipleChoice = Answers[question] !== undefined;

                if (isMultipleChoice) {
                    if (Answers[question] === theirAnswers[question]) {
                        correct += 1;
                    };
                    outOf += 1;
                } else {
                    fields.push({
                        name: question,
                        value: theirAnswers[question],
                        inline: true
                    });
                };
            };
            
            let timeSpent = null;
            if (dataToSend.TimeTaken) {
                timeSpent = formatTime(dataToSend.TimeTaken);
            };

            const description = `**User Information**${(userVerif) ? `\nDiscord: <@${userVerif.discordId}>` : ""}\nRoblox: [${(user.displayName) ? `${user.displayName} | ` : ``}${user.username}](https://roblox.com/users/${UserId}/profile)${(timeFormatted) ? `\nTime Spent on App: ${timeFormatted}` : ""}\n\nMultiple choice score: ${correct}/${outOf}`;
            try {
                const channel = await Client.channels.fetch(Settings.Options.AnnouncementChannels.Applications)
                await CreateEmbed(channel, `Application`, description, null, fields, null, null, null, null, null);
                newData.splice(i, 1);

                resolved = parsed.length - 1 <= Number(i);
            } catch(error) {
                console.log(error);
            };
        };

        setTimeout(async () => {
            if (resolved) {
                try {
                    await DataStore.SetAsync("ADMIN", newData);
                } catch(error) {
                    console.error(error);
                }
            };
        }, parsed.length + 1 * 5000);
    } catch(error) {
        console.error(error);
    };
};

module.exports = getFailedSentApps;