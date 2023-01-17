const CommandFormat = require('../../../Utils/Formats/CommandFormat');
const getDiscordMember = require('../../../Utils/Functions/getDiscordMember');
const CreateEmbed = require('../../../Utils/Functions/CreateEmbed');

class Command extends CommandFormat {
  constructor() {
    // Cmd Name, Cmd Description, Alias, Usage, canBeUsedInDms, isSlashCommand, Permissions
    super('kick', 'Kick a discord user with a given reason.', [], '<User> [Reason]', true, true, [
        // Do not put discord permission flags, put the names instead.
        "Administrator"
    ]);
  };

  async run(Client, Message, Args) {
    try {
        const target = await getDiscordMember(Message.guild, Args[0]);

        if (!target) {
            return CreateEmbed(Message, 'Error', 'Invalid user.', null, null, null, null, null, null, null, { reply: true });
        };

        if (target.id === Message.author.id) {
            return CreateEmbed(Message, 'Error', 'You cannot kick yourself.', null, null, null, null, null, null, null, { reply: true });
        };

        if (target.id === Client.user.id) {
            return CreateEmbed(Message, 'Error', 'You cannot kick me.', null, null, null, null, null, null, null, { reply: true });
        };

        if (target.roles.highest.comparePositionTo(Message.member.roles.highest) >= 0) {
            return CreateEmbed(Message, 'Error', 'You cannot kick a user with a role equal or higher than your own.', null, null, null, null, null, null, null, { reply: true });
        };

        target.kick(Args.splice(0, 1).join(" ") || 'No reason given.');
        return CreateEmbed(Message, 'Success', `Successfully kicked ${target.user.tag}`, null, null, null, null, null, null, null, { reply: true });
    } catch(err) {
        console.error(err);
    }
  };
};

module.exports = Command; // Enable this to create the command.