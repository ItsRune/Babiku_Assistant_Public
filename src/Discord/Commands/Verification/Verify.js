const CommandFormat = require('../../../Utils/Formats/CommandFormat');
const CreateEmbed = require('../../../Utils/Functions/CreateEmbed');
const verifModel = require('../../../Mongoose/Verification');
const Roblox = require('noblox.js');
const fs = require('fs');
const path = require('path');
const verificationPath = path.join(__dirname, '../../../Files/verificationKeys.json');
const getSettings = require('../../../Utils/Functions/getSettings');

class Command extends CommandFormat {
  constructor() {
    // Cmd Name, Cmd Description, Alias, Usage, canBeUsedInDms, Permissions
    super('verify', 'Verify your roblox with your discord.', [], '[Username/UserId]', false, true, [
        // Do not put discord permission flags, put the names instead.
    ]);
  };

  async run(Client, Message, Args) {
    const Settings = getSettings();
    if (Message.userInformation != null) {
        try {
            if (await verifModel.exists({robloxId: Message.userInformation.robloxId})) {
                return CreateEmbed(Message, 'Verification', 'This discord account is already linked to a roblox user, please unlink before running this command.');
            };
        } catch(error) {
            console.error(error);
        }
    };

    if (!Args[0]) {
        try {
            let currentMessage = null;
            currentMessage = await CreateEmbed(
                Message, 'Verification', 'Please respond with either your roblox userid or username.',
                null, null, null, null, null, null, null,
                { reply: true }
            );

            const awaitedMessages = await Message.channel.awaitMessages({
                filter: (m => m.author.id === Message.author.id),
                max: 1,
                time: 60_000,
                errors: ['time']
            });
            const newMsg = awaitedMessages.first();

            Args[0] = newMsg.content.split(" ")[0];
            if (Args[0].toLowerCase() == "cancel") {
                return await currentMessage.delete();
            };

            await currentMessage.delete();
        } catch(error) {
            console.error(error);
        };
    };

    try {
        if (/[\w]+/g.test(Args[0]) === false) {
            await Message.reply({embeds:[{
                title: `Verification Error`,
                description: `I couldn't process your request, please double check your username/userid then rerun this command.`
            }]});
            return;
        };

        let userId = 0;
        if (!Number(Args[0])) {
            userId = await Roblox.getIdFromUsername(Args[0]);
        } else {
            userId = Number(Args[0]);
        };

        try {
            if (await verifModel.exists({robloxId: userId})) {
                return CreateEmbed(Message, 'Verification', 'That account appears to already be linked to a discord account. If you believe there is a discrepancy with this, please contact an HR.');
            }
        } catch(error) {
            console.error(error);
        }

        const verifFileContents = JSON.parse(fs.readFileSync(verificationPath, 'utf-8'));
        verifFileContents.push({
            discordInfo: {
                username: Message.author.username,
                discriminator: Message.author.discriminator,
                id: String(Message.member.id)
            },
            timeInserted: Date.now(),
            userId
        });

        // .length > 1 since im a moron and forgot that i push above this statement :face_palm:
        if (verifFileContents.filter(c => c.discordInfo.id === String(Message.member.id)).length > 1) {
            return CreateEmbed(Message, 'Verification', `You're already in the process of verifying an account, please verify that account before trying to verify another.`);
        };

        fs.writeFile(verificationPath, JSON.stringify(verifFileContents), 'utf-8', (err) => {
            if (err)
                console.error(err);
        });

        await CreateEmbed(Message, 'Verification', `Please join the game below to finish your verification process.`, 
            null, null, null, null, null, [
                {
                    Label: "Game Link",
                    Url: Settings.verificationGameUrl,
                    Color: "LINK",
                    ID: String(Math.floor(Math.random() * 999999999999))
                }
            ], null,
            { reply: true }
        );
    } catch(error) {
        console.error(error);
    };
  };
};

module.exports = Command; // Enable this to create the command.