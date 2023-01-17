const axios = require('axios');
const Roblox = require('noblox.js');
const CreateEmbed = require('./CreateEmbed');
const getSettings = require('./getSettings');

async function tryExistingVerification(Member, Guild) {
    const Settings = getSettings();
    axios({
        url: `https://v3.blox.link/developer/discord/${Member.id}`,
        method: "GET",
        headers: {
            'api-key': '893f0c7f-1128-46ce-92b7-675d48328d51e4df3d9b-8777-4327-a33b-f7b0eb7c78d34338534a-f366-4f12-8eae-81bad2993fd7'
        }
    }).then(async (response) => {
        const data = response.data.user;
    
        try {
            const primaryAccount = (Object.keys(data).indexOf('primaryAccount') != -1) ? data.primaryAccount : data.robloxId;
            const accountInfo = await Roblox.getPlayerInfo(Number(primaryAccount));
            const playerGroupInfo = (await Roblox.getGroups(Number(primaryAccount))).filter(g => g.Id === Settings.robloxGroupId);
            const thumbnail = await Roblox.getPlayerThumbnail(Number(primaryAccount));

            const descriptionFields = [
                `Username: [*${accountInfo.username}*](https://roblox.com/users/${primaryAccount}/profile)`
            ]

            if (playerGroupInfo.length > 0) {
                descriptionFields.push(`Group Rank: **${playerGroupInfo[0].Role}**`);
            };
    
            await CreateEmbed(
                Member, 
                `${Settings.Options.embedHeader} |  Verification`, 
                `Hello and welcome to the server, we've detected that you have a roblox account already associated with your discord. Would you like to use it?\n\n${descriptionFields.join("\n")}`,
                null, null, null,
                thumbnail[0].imageUrl,
                null,
                [
                    {
                        Color: "Success",
                        Label: "Yes",
                        ID: `joinverification_yes_${primaryAccount}_${Member.id}_${Guild.id}_${Math.random() * 1000000}`
                    },
                    {
                        Color: "Danger",
                        Label: "No",
                        ID: `joinverification_no_${primaryAccount}_${Member.id}_${Guild.id}_${Math.random() * 1000000}`
                    }
                ]
            );
        } catch(error) {
            console.error(error);
        };
    }).catch(err => {
        return console.error(err);
    });
}

module.exports = tryExistingVerification;