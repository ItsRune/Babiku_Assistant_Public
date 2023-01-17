const EventFormat = require('../../Utils/Formats/EventFormat');
const verifModel = require('../../Mongoose/Verification');
const getSettings = require('../../Utils/Functions/getSettings');

class Event extends EventFormat {
  constructor() {
    super('messageCreate');
  };

  certainCommands = [
    "shift", "ban", "kick", "newalliance", "inactivitynotice"
  ];

  async run(Client, Message) {
    const Settings = getSettings();

    if (Message.author.bot) return;
    if (!Message.content.toLowerCase().startsWith(String(Client.Prefix).toLowerCase())) return;
    if (Client.CommandLimiter.take(Message.author.id)) return;
    
    const Args = Message.content.toLowerCase().slice(String(Client.Prefix).length).split(" ");
    const Cmd = Args.shift();
    const Command = Client.Commands.get(Cmd);
    
    if (!Command) return;
    if (
      // For locked commands.
      (Settings.Options.lockedForMainServer === true && 
      Message.guildId === "741105635155902486" &&
      Settings.betaTesters.indexOf(String(Message.author.id)) === -1) ||
      // For certain commands.
      (Settings.Options.semiLockedForMain === true &&
      Message.guildId === "741105635155902486" &&
      this.certainCommands.indexOf(String(Command.name).toLowerCase()) === -1)
    ) return;

    try {
      const userData = await verifModel.findOne({discordId: String(Message.member.id)});
      Message.userInformation = userData;
    } catch(error) {
      Message.userInformation = null;
    }

    if (Message.channel.type === "DM" && Command.dmsAllowed === true) {
      return Command.run(Client, Message, Args);
    }

    const hasPermission = await Client.hasPermission(Message, Command.permissions);
    if (hasPermission) {
      Command.run(Client, Message, Args);
    }
  };
};

module.exports = Event;