const CommandFormat = require('../../../Utils/Formats/CommandFormat');
const getGroupRoles = require('../../../Utils/Functions/getGroupRoles');
const CreateEmbed = require('../../../Utils/Functions/CreateEmbed');
const verifModel = require('../../../Mongoose/Verification');
const Roblox = require('noblox.js');
const massGetRoles = require('../../../Utils/Functions/massGetRoles');
const getDiscordMember = require('../../../Utils/Functions/getDiscordMember');

class Command extends CommandFormat {
  constructor() {
    // Cmd Name, Cmd Description, Alias, Usage, canBeUsedInDms, isSlashCommand, Permissions
    super('update', 'Forces getroles onto the specified user.', [], '<User/all>', false, false, [
        "rank:32:>="
    ]);
  };

  upperCaseFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Convert discord collection to array.
  async getArray(collection) {
    const arr = [];
    
    collection.forEach((v) => {
      if (v.user.bot === false) {
        arr.push(v);
      };
    });

    return arr;
  };

  async run(Client, Message, Args) {
    const user = Args[0];
    let target = null;

    try {
        // Fetch the guild to update the cache.
        await Client.guilds.fetch(Message.guild.id);

        if (user === 'all') {
            const hasPermissionForAll = await Client.hasPermission(Message, ["MANAGE_GUILD"], Message.guild);
            if (!hasPermissionForAll) return CreateEmbed(Message, 'Error', 'You do not have permission to use this command.', null, null, null, null, null, null, null, { reply:true });
            target = await this.getArray(Message.guild.members.cache);
        } else if (user != null) {
            target = await getDiscordMember(Message.guild, Args[0]);
        } else {
            target = Message.member;
        }

        if (!target) {
            return CreateEmbed(Message, 'Error', 'Invalid user.', null, null, null, null, null, null, null, { reply: true });
        };

        if (Array.isArray(target)) {
            // discord rate limits: 50 requests/1 second.
            // roblox rate limits: 100 requests/1 minute.
            
            const secondsRequired = Math.ceil(target.length / 50); // 50 requests/1 second.
            const minutesRequired = Math.floor(secondsRequired / 60);
            const hoursRequired = Math.floor(minutesRequired / 60);

            if (secondsRequired > 50) {
              CreateEmbed(Message, 'Update All', `This action will take roughly \`${hoursRequired}:${minutesRequired}:${secondsRequired}\` to complete with ${target.length} members. Please wait.`, null, null, null, null, null, null, null, { reply: true });
            };
            
            const returned = await massGetRoles(target, Message.guild);
            CreateEmbed(Message, 'Update All', `Successfully updated ${returned[0]} / ${target.length} members.`, null, null, null, null, null, null, null, { reply: true });
            return;
        };

        if (!(await verifModel.exists({discordId: String(target.id)}))) {
            return CreateEmbed(Message, 'Error', 'User is not verified.', null, null, null, null, null, null, null, { reply: true });
        };

        const Settings = require('../../../Utils/Functions/getSettings')();
        const document = await verifModel.findOne({discordId: String(target.id)});
        const playerThumbnail = (await Roblox.getPlayerThumbnail(document.robloxId, 720, "png", true, "headshot"))[0].imageUrl;
        const { success, data} = await getGroupRoles(target, Message.guild, Number(document.robloxId), Settings.robloxGroupId);
        
        if (!success) {
            return CreateEmbed(Message, 'Error', `Failed to get roles.\n\nError: ${data}`, null, null, null, null, null, null, null, { reply: true });
        };

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

        if (data[2] === null) {
          // Empty cuz its cool like that :D
        } else if (typeof(data[2]) == "string" && data[2].split("|")[2] === "true") {
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

        const context = "their";
        await CreateEmbed(Message, 'Get Roles', (rolesWereChanged == true) ? `${this.upperCaseFirstLetter(context)} roles have been updated.` : `${this.upperCaseFirstLetter(context)} roles are up to date!`, null, fields, null, playerThumbnail);
    } catch(error) {
        console.log(error);
        CreateEmbed(Message, 'Error', 'An error has occured. (Internal Error)', null, null, null, null, null, null, null, { reply: true });
    }
  };
};

module.exports = Command; // Enable this to create the command.