const Discord = require('discord.js');
const CommandFormat = require('../../../Utils/Formats/CommandFormat');
const shiftModel = require('../../../Mongoose/Shift');
const { getCurrentWeek } = require('../../../Utils/Functions/getCurrentWeek');
const CreateEmbed = require('../../../Utils/Functions/CreateEmbed');
const profileGenerator = require('../../../Utils/Functions/profileGenerator');

class Command extends CommandFormat {
  constructor() {
    // Cmd Name, Cmd Description, Alias, Usage, canBeUsedInDms, isSlashCommand, Permissions
    super('profile', 'Displays the roblox profile from the bot\'s standpoint.', [], '', true, false, [
        // Do not put discord permission flags, put the names instead.
    ]);
  };

  async run(Client, Message, Args) {
    if (!Message.userInformation) {
      CreateEmbed(Message, `You must be verified to use this command.`);
      return;
    };
    
    const userData = Message.userInformation;
    const Member = Message.member;
    const currentWeek = getCurrentWeek();
    let shiftData;

    try {
      shiftData = await shiftModel.findOne({ startWeek: currentWeek.start });
      shiftData = shiftData.data[userData.robloxId];
    } catch(error) {
      shiftData = null;
    };

    const profileBuffer = await profileGenerator(userData, shiftData);

    Message.channel.send({
      content: `<@${userData.discordId}>`,
      files: [profileBuffer]
    });

    // const description = ``;
    // CreateEmbed(Message, '${Settings.Options.embedHeader} | Profile', description, null, null, null, null, null, null, null, { reply: true });
  };
};

// module.exports = Command; // Enable this to create the command.