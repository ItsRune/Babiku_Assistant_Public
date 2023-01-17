const CommandFormat = require('../../../Utils/Formats/CommandFormat');
const fs = require('fs');
const path = require('path');
const CreateEmbed = require('../../../Utils/Functions/CreateEmbed');
const pathToChangelog = path.join(__dirname, '../../../Files/Changelog.json');

class Command extends CommandFormat {
  constructor() {
    // Cmd Name, Cmd Description, Alias, Usage, canBeUsedInDms, isSlashCommand, Permissions
    super('changelog', 'Shows the most recent changelog of the bot.', ['cl'], '', true, false, [
        // Do not put discord permission flags, put the names instead.
    ]);
  };

  async run(Client, Message, Args) {
    const changelogs = JSON.parse(fs.readFileSync(pathToChangelog, 'utf-8'));

    const firstEntry = changelogs[0];
    await CreateEmbed(Message, `${Client.user.tag} | Changelog`, `Version: ${firstEntry.version}\nChanges: \n○ ${firstEntry.changes.join("\n○ ")}`, null, null, null, null, null, null, null, { reply: true });
  };
};

// module.exports = Command; // Enable this to create the command.