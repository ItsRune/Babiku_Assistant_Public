const Roblox = require('noblox.js');
const CommandFormat = require('../../../Utils/Formats/CommandFormat');
const CreateEmbed = require('../../../Utils/Functions/CreateEmbed');
const inactivityModel = require('../../../Mongoose/InactivityNotices');
const getSettings = require('../../../Utils/Functions/getSettings');

class Command extends CommandFormat {
  constructor() {
    // Cmd Name, Cmd Description, Alias, Usage, canBeUsedInDms, isSlashCommand, Permissions
    super('inactivitynotice', 'Creates the option to start-up an inactivity notice form.', ['in', 'inactivity'], '', false, false, [
        // Do not put discord permission flags, put the names instead.
        "rank:32:>="
    ]);
  };

  async run(Client, Message, Args) {
    const Settings = getSettings();
    try {
      if (await inactivityModel.exists({ discordId: String(Message.member.id) })) {
        return await CreateEmbed(Message, `${Settings.Options.embedHeader} |  Inactivity`, `You're already currently on an inactivity notice.`);
      } else if (!Message.userInformation) {
        return await CreateEmbed(Message, `${Settings.Options.embedHeader} | Inactivity`, `Please verify before using this command.`);
      };

      const playerRank = await Roblox.getRankInGroup(Settings.robloxGroupId, Message.userInformation.robloxId);
      if (playerRank < Settings.Options.GroupRanks.MR) {
        return;
      };

      await CreateEmbed(Message.member, `${Settings.Options.embedHeader} | Inactivity Form`, `To begin your form, please click on the button labelled as "Begin My Form".`,
      null, null, null, null, null, [
        {
          Label: "Begin My Form",
          Color: "Secondary",
          ID: `inactivitynotice_${Message.guild.id}_${String(Message.member.id)}_${Message.userInformation.robloxId}`,
        }
      ]);
      await CreateEmbed(Message, `${Settings.Options.embedHeader} | Inactivity Form`, `I've dmed you with the beginning of your form.`, null, null, null, null, null, null, null, {
        reply: true
      });
    } catch(error) {
      console.log(error);
    };
  };
};

module.exports = Command; // Enable this to create the command.