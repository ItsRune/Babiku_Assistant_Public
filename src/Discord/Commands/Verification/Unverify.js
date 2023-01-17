const CommandFormat = require('../../../Utils/Formats/CommandFormat');
const fs = require('fs');
const path = require('path');
const verifModel = require('../../../Mongoose/Verification');
const CreateEmbed = require('../../../Utils/Functions/CreateEmbed');
const Roblox = require('noblox.js');
const verificationKeysPath = path.join(__dirname, '../../../Files/verificationKeys.json');

class Command extends CommandFormat {
  constructor() {
    // Cmd Name, Cmd Description, Alias, Usage, canBeUsedInDms, Permissions
    super('unverify', 'Removes your discord account link with our verification system.', ['unlink'], '', false, false, [
        // Do not put discord permission flags, put the names instead.
    ]);
  };

  async run(Client, Message, Args) {
    const removed = [];
    try {
        const fileContents = JSON.parse(await fs.readFileSync(verificationKeysPath, 'utf-8'));
        const matches = fileContents.filter(f => f.discordInfo.id === String(Message.member.id));

        if (matches.length > 0) {
            for (let i = 0; i < matches.length; i++) {
                const thisMatch = matches[i];
                const indexToRemoveFrom = fileContents.findIndex(f => f.discordInfo.id === String(Message.member.id) && f.userId === thisMatch.userId);

                removed.push(thisMatch);
                fileContents.splice(indexToRemoveFrom, 1);
            };
        };

        if (await verifModel.exists({discordId: String(Message.member.id)})) {
            const document = await verifModel.findOneAndDelete({discordId: String(Message.member.id)});
            removed.push(document);
        }

        let extraDesc = [];
        extraDesc.push(`Removed ${removed.length} roblox account${(removed.length > 1 && removed.length != 0) ? "s" : ""} from this discord account.\n`)
        for (let i = 0; i < removed.length; i++) {
            let dir = (Object.keys(removed[i]).indexOf('robloxId') != -1) ? "robloxId" : "userId"

            try {
                const data = await Roblox.getPlayerInfo(removed[i][dir]);
                extraDesc.push(`Removed ${data.displayName} (@[${data.username}](https://roblox.com/users/${removed[i][dir]}/profile))`);
            } catch(error) {
                console.error(error);
                extraDesc = ["Removed 0 roblox accounts from this discord account."]
            }
        }

        fs.writeFile(verificationKeysPath, JSON.stringify(fileContents), 'utf-8', (err) => {
            if (!err) return;
            console.error(err);
        });

        CreateEmbed(Message, 'Remove Verification', extraDesc.join("\n"),
            null, null, null, null, null, null, null,
            { reply: true }
        );

        return removed;
    } catch(error) {
        console.error(error);
        return CreateEmbed(Message, 'Remove Verification', 'There appears there was an issue whilst processing this command. Please retry later.',
            null, null, null, null, null, null, null,
            { reply: true }
        );
    }
  };
};

module.exports = Command; // Enable this to create the command.