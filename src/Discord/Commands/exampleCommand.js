const CommandFormat = require('../../Utils/Formats/CommandFormat');

class Command extends CommandFormat {
  constructor() {
    // Cmd Name, Cmd Description, Alias, Usage, canBeUsedInDms, isSlashCommand, Permissions
    super('ping', 'test', ['p'], '', true, false, [
        // Do not put discord permission flags, put the names instead.
    ]);
  };

  async run(Client, Message, Args) {
    
  };
};

// module.exports = Command; // Enable this to create the command.