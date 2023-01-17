const Client = require('../../Discord/index');
const getSettings = require('./getSettings');
const fs = require('fs');
const path = require('path');
const CreateEmbed = require('./CreateEmbed');

async function messageBetaTesters() {
    const Settings = getSettings();
    const alreadyMessaged = JSON.parse(fs.readFileSync(path.join(__dirname, '../../Files/betaTestersNotified.json'), 'utf-8'));

    for (const i in Settings.betaTesters) {
        const discordId = Settings.betaTesters[i];
        if (alreadyMessaged.indexOf(discordId) !== -1) continue;

        const user = await Client.users.fetch(discordId);
        if (!user) continue;

        CreateEmbed(user, `${Settings.Options.embedHeader} |  Beta`, `Hello, ${user.tag}!\n\nYou have been __enrolled__ for beta testing the bot's locked commands.\n\nPlease note that this is a __private__ beta testing.\n\nIf you have any questions, please contact <@352604785364697091>.\n\nIf you'd like to unenroll please click the 'Unenroll' button down below. Note: If you unenroll you will forever lose access to beta test of this bot.`,
        null, null, null, null, null, [
            {
                Label: "Unenroll",
                Color: "Danger",
                ID: `betaunenroll_${discordId}_${Math.random() * 100000000}`,
            }
        ]);
        alreadyMessaged.push(discordId);
    };

    fs.writeFileSync(path.join(__dirname, '../../Files/betaTestersNotified.json'), JSON.stringify(alreadyMessaged));
};

module.exports = messageBetaTesters;