const CreateEmbed = require('../../../Utils/Functions/CreateEmbed');
const getSettings = require('../../../Utils/Functions/getSettings');
const CommandFormat = require('../../../Utils/Formats/CommandFormat');

class Command extends CommandFormat {
  constructor() {
    // Cmd Name, Cmd Description, Alias, Usage, canBeUsedInDms, isSlashCommand, Permissions
    super('reportbug', 'Reports a bug for this bot.', ['report', 'bug'], '', true, false, [
        // Do not put discord permission flags, put the names instead.
    ]);
  };

  async run(Client, Message, Args) {
    const Settings = getSettings();
    try {
        const Channel = await Client.channels.fetch(Settings.bugReportChannelId);

        if (!Channel) return;
        CreateEmbed(Channel, `Incoming Report`, `Reporter: ${Message.author.tag}\n\n${Message.content}`);
    } catch(error) {
        CreateEmbed(Message, `Error`, `${error.message}`);
    }
  };
};

module.exports = Command; // Enable this to create the command.