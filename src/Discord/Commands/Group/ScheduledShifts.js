const CommandFormat = require('../../../Utils/Formats/CommandFormat');
const CreateEmbed = require('../../../Utils/Functions/CreateEmbed');
const getSettings = require('../../../Utils/Functions/getSettings');

class Command extends CommandFormat {
  constructor() {
    // Cmd Name, Cmd Description, Alias, Usage, canBeUsedInDms, isSlashCommand, Permissions
    super('schedule', 'Shows the currently scheduled shifts.', [], '', true, false, [
        // Do not put discord permission flags, put the names instead.
    ]);
  };

  async run(Client, Message, Args) {
    const Settings = getSettings();
    let opts = [];

    if (Object.keys(Message.userInformation.data).indexOf('Shifts') !== -1) {
        opts.push({
            Label: "Your shifts",
            Value: "personal",
            Description: "Your currently scheduled shifts."
        });
    };

    opts.push({
        Label: "Restaurant",
        Value: "restaurant",
        Description: "Shows Restaurant ONLY shifts."
    }, {
        Label: "Training",
        Value: "training",
        Description: "Shows Training ONLY shifts."
    });

    CreateEmbed(Message, `${Settings.Options.embedHeader} | Upcoming Shifts`, `Please select below which shifts you'd like to view.`,
    null, null, null, null, null, null, {
        Placeholder: "Select a shift type.",
        ID: `scheduleshifts_${Math.random() * 10000000}`,
        maxValues: 1,
        Options: opts
    });
  };
};

module.exports = Command; // Enable this to create the command.