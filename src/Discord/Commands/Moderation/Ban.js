const CommandFormat = require('../../../Utils/Formats/CommandFormat');
const CreateEmbed = require('../../../Utils/Functions/CreateEmbed');
const getDiscordMember = require('../../../Utils/Functions/getDiscordMember');

class Command extends CommandFormat {
  constructor() {
    // Cmd Name, Cmd Description, Alias, Usage, canBeUsedInDms, isSlashCommand, Permissions
    super('ban', 'Bans a member from the discord.', [], '<User> <Reason>', false, true, [
        // Do not put discord permission flags, put the names instead.
        "Administrator",
        "Ban_Members"
    ]);
  };

  async run(Client, Message, Args) {
    try {
      const memberToBan = await getDiscordMember(Message.guild, Args[0]);
      const reason = Message.content.slice(Client.Prefix.length + this.name.length + Args[0].length + 2);
      
      if (memberToBan.id == Message.author.id) {
        return await CreateEmbed(Message, `Error`, `You cannot ban yourself.`,
        null, null, null, null, null, null, null,
        {
          reply: true
        });
      };

      if (memberToBan.id == Message.guild.ownerId) {
        return await CreateEmbed(Message, `Error`, `You cannot ban the server owner.`,
        null, null, null, null, null, null, null,
        {
          reply: true
        });
      };

      if (memberToBan.roles.highest.comparePositionTo(Message.member.roles.highest) > 0) {
        return await CreateEmbed(Message, `Error`, `You cannot ban a member with a role higher than yours.`,
        null, null, null, null, null, null, null,
        {
          reply: true
        });
      };

      if (memberToBan.id === Client.user.id) {
        return CreateEmbed(Message, 'Error', 'You cannot ban me.', null, null, null, null, null, null, null, { reply: true });
      };

      if (!memberToBan.bannable) {
        return CreateEmbed(Message, 'Error', 'I cannot ban this member.', null, null, null, null, null, null, null, { reply: true });
      };

      await CreateEmbed(memberToBan, `${Settings.Options.embedHeader} | `, `You have been banned for; \`${reason}\``);
      await memberToBan.ban(reason);
    } catch(error) {
      console.error(error);
      await CreateEmbed(Message, `Error`, `An error occured while banning the member.`,
      null, null, null, null, null, null, null,
      {
        reply: true
      });
    }
  };
};

module.exports = Command; // Enable this to create the command.