const CommandFormat = require('../../../Utils/Formats/CommandFormat');
const CreateEmbed = require('../../../Utils/Functions/CreateEmbed');
const getSettings = require('../../../Utils/Functions/getSettings');

class Command extends CommandFormat {
  constructor() {
    // Cmd Name, Cmd Description, Alias, Usage, canBeUsedInDms, isSlashCommand, Permissions
    super('eval', 'Allows the developer to run code through the bot.', [], '', true, false, [
        "clientid:352604785364697091"
    ]);
  };

  async clean(Client, text) {
    if (text && text.constructor.name == "Promise") {
        text = await text;
    }

    if (typeof text !== "string") {
        text = require("util").inspect(text, { depth: 1 });
    }

    for (const [key, value] of Object.entries(this.Settings)) {
        if (key.toLowerCase().indexOf("token") != -1 || key.toLowerCase().indexOf("key") != -1 || key.toLowerCase().indexOf("uri") != -1) {
            text = text.replace(String(value), "[Removed]");
        };
    };

    text = text
        .replace(/`/g, "`" + String.fromCharCode(8203))
        .replace(/@/g, "@" + String.fromCharCode(8203));

    return text;
  };

  async run(Client, Message, Args) {
    if (Message.author.id != "352604785364697091") return; // Extra protection.
    this.Settings = getSettings();

    const toEval = Message.content.slice(Client.Prefix.length + this.name.length + 1);
    try {
        const evaled = eval(`(async () => { return ${toEval} })()`);
        const cleaned = await this.clean(Client, evaled);
        
        CreateEmbed(Message.channel, `${this.Settings.Options.embedHeader} | Debug`, `Input:\n\`\`\`js\n${toEval}\`\`\`\nResult:\n\`\`\`js\n${cleaned}\`\`\``);
    } catch (err) {
        CreateEmbed(Message.channel, `${this.Settings.Options.embedHeader} | Debug`, `Input:\n\`\`\`js\n${toEval}\`\`\`\n**Error**:\n\`\`\`xl\n${err}\n\`\`\``);
    };
  };
};

module.exports = Command; // Enable this to create the command.