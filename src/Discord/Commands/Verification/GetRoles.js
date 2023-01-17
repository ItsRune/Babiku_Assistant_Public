const CommandFormat = require('../../../Utils/Formats/CommandFormat');
const CreateEmbed = require('../../../Utils/Functions/CreateEmbed');
const getGroupRoles = require('../../../Utils/Functions/getGroupRoles');
const Roblox = require('noblox.js');
const getSettings = require('../../../Utils/Functions/getSettings');

class Command extends CommandFormat {
  constructor() {
    // Cmd Name, Cmd Description, Alias, Usage, canBeUsedInDms, isSlashCommand, Permissions
    super('getroles', 'Gets your group roles and applies them to your discord.', [], '', false, false, [
        // Do not put discord permission flags, put the names instead.
    ]);
  };

  upperCaseFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  async run(Client, Message, Args) {
    if (Message.userInformation == null) {
      return CreateEmbed(Message, 'Verification Error', 'You must be verified to use this command, would you like to verify?', null, null, null, null, null, [
        {
          Label: "Verify",
          Color: "Secondary",
          ID: `verification_start_${Message.member.id}`
        }
      ]);
    };

    try {
      const Settings = getSettings();
      const robloxId = Message.userInformation.robloxId;
      const playerThumbnail = (await Roblox.getPlayerThumbnail(robloxId, 720, "png", true, "headshot"))[0].imageUrl;
      const { success, data } = await getGroupRoles(Message.member, Message.guild, robloxId, Settings.robloxGroupId);

      console.log(data);

      if (success) {
        const fields = [];
        const rolesWereChanged = (data[0].length > 0 || data[1].length > 0);

        if (data[0].length > 0) {
          fields.push({
            name: "Added",
            value: data[0].join(', '),
            inline: true
          });
        }

        if (data[1].length > 0) {
          fields.push({
            name: "Removed",
            value: data[1].join(', '),
            inline: true
          });
        }

        if (typeof(data[2]) == "string" && data[2].split("|")[2] === "true") {
          fields.push({
            name: "Nickname Changed",
            value: `Before: \`${data[2].split("|")[0]}\`\nAfter: \`${data[2].split("|")[1]}\``,
          });
        } else if (typeof(data[2] == "string") && data[2].split("|")[1] === "false") {
          fields.push({
            name: "Nickname Error",
            value: data[2].split("|")[0]
          });
        };

        const context = "your";
        await CreateEmbed(Message, 'Get Roles', (rolesWereChanged == true) ? `${this.upperCaseFirstLetter(context)} roles have been updated.` : `${this.upperCaseFirstLetter(context)} roles are up to date!`, null, fields, null, playerThumbnail);
      } else {
        await CreateEmbed(Message, 'Get Roles', `${data}`, null, null, null, playerThumbnail);
      }
    } catch(error) {
      console.error(error);
      await CreateEmbed(Message, 'Get Roles', `An error occured while trying to get your roles.`);
    }
  };
};

module.exports = Command; // Enable this to create the command.