const CommandFormat = require('../../../Utils/Formats/CommandFormat');
const CreateEmbed = require('../../../Utils/Functions/CreateEmbed');
const getSettings = require('../../../Utils/Functions/getSettings');

class Command extends CommandFormat {
  constructor() {
    // Cmd Name, Cmd Description, Alias, Usage, canBeUsedInDms, isSlashCommand, Permissions
    super('help', 'Displays a list of all the commands.', ['cmds'], '', true, false, [
        // Do not put discord permission flags, put the names instead.
    ]);

    this.categoryDescriptions = {
      "General": "General commands that can be used in any bot-commands channel.",
      "Moderation": "Commands that can be used by moderators and above.",
      "Verification": "Commands apart of the verification system.",
      "Fun": "Commands that should probably not be apart of this bot.",
      "Group": "Commands that can be used by verified group MRs and above.",
      "Misc": "Commands that don't fit in any other category.",
    };
  };

  #commandExistsInAnyCategory(Command, categoryCommands) {
    if (!categoryCommands[Command.category]) return true;
      const helpPages = categoryCommands[Command.category];

      for (let j = 0; j < helpPages.length; j++) {
        for (let i = 0; i < helpPages[j].length; i++) {
          if (helpPages[j][i].filter(c => c.name.indexOf(Command.name) === 0).length > 0) return true;
        };
      };
      return false;
  };

  #parseCategoryCommands(categoryCommands) {
    const Keys = Object.keys(categoryCommands);
    const output = {};
    
    for (let i = 0; i < Keys.length; i++) {
      const Key = Keys[i];
      output[Key] = categoryCommands[Key][0];
    };

    return output;
  };

  async getCategoryCommands(Client, Member, categoryName) {
    const commands = Client.Commands;
    const categoryCommands = {};
    
    commands.forEach(async (cmd) => {
      // Check to make sure the category exists.
      if (!categoryCommands[cmd.category]) {
        categoryCommands[cmd.category] = [[[]], 0];
      };

      if (await Client.hasPermission(Member, cmd.permissions)) {
        // Constants
        const pageIndex = categoryCommands[cmd.category][1];
        const currentLengthOfPage = categoryCommands[cmd.category][0][pageIndex].length;
  
        // Check to see if the page length is greater than the max (6), then create a new page.
        if (currentLengthOfPage > 0 && currentLengthOfPage % 6 === 0) {
          categoryCommands[cmd.category][1]++;
          categoryCommands[cmd.category][0].push([]);
        };
  
        // Check to make sure the category matches the one request and that the command isn't already present within the array.
        if (this.#commandExistsInAnyCategory(cmd, categoryCommands) == false) {
          categoryCommands[cmd.category][0][pageIndex].push({name: `${cmd.name} ${cmd.usage}`, value: cmd.desc});
        };
      };
    });

    return (String(categoryName).toLowerCase() == "all") ? this.#parseCategoryCommands(categoryCommands) : categoryCommands[categoryName][0];
  }

  getCategories(Client) {
    const Commands = Client.Commands;
    const categories = [];

    Commands.forEach((cmd) => {
      if (categories.indexOf(cmd.category) == -1) {
        categories.push(cmd.category);
      };
    });
    return categories;
  }

  async run(Client, Message, Args) {
    const Settings = getSettings();
    const categories = this.getCategories(Client);
    let optionData = [];

    for (let i = 0; i < categories.length; i++) {
      optionData.push({
        Label: categories[i],
        Description: this.categoryDescriptions[categories[i]],
        Value: categories[i]
      });
    };
    
    CreateEmbed(Message, `${Settings.Options.embedHeader} | Help`, 'These are all of my listed commands, note that `<>` means the parameter is required and `[]` means they\'re optional.\nBelow you can select a category to look through it\'s commands.',
    null, null, null, null, null, null, {
      Placeholder: 'Select a category to search through the commands.',
      Options: optionData,
      ID: `help_0_none_${Date.now()}_${(Math.random() * 1000000000) + 1}_${Message.member.id}`,
      maxValues: 1
    }, {
      reply: true
    });
  };
};

module.exports = Command; // Enable this to create the command.