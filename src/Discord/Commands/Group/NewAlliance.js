const CreateEmbed = require('../../../Utils/Functions/CreateEmbed');
const CommandFormat = require('../../../Utils/Formats/CommandFormat');
const getSettings = require('../../../Utils/Functions/getSettings');

class Command extends CommandFormat {
  constructor() {
    // Cmd Name, Cmd Description, Alias, Usage, canBeUsedInDms, isSlashCommand, Permissions
    super('newalliance', 'Something', ['newally'], '', false, false, [
        // Do not put discord permission flags, put the names instead.
        "verified"
    ]);
  };

  async run(Client, Message, Args) {
    const Settings = getSettings();
    return await CreateEmbed(Message, `${Settings.Options.embedHeader} | Alliances`, `Please click the button below to start the alliance creation process.`,
    null, null, null, null, null, [
        {
            Label: "Click Here",
            Color: "Secondary",
            ID: `newalliance_${Message.member.id}`
        }
    ], null,
    {
        reply: true
    });
  };
};

module.exports = Command; // Enable this to create the command.