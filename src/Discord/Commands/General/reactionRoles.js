const CommandFormat = require('../../../Utils/Formats/CommandFormat');
const CreateEmbed = require('../../../Utils/Functions/CreateEmbed');
const getSettings = require('../../../Utils/Functions/getSettings');
const emoji = require('emoji-dictionary');

class Command extends CommandFormat {
  constructor() {
    // Cmd Name, Cmd Description, Alias, Usage, canBeUsedInDms, isSlashCommand, Permissions
    super('reactionroles', 'Sends a new reaction role message to the specified channel.', ['rr'], '', true, false, [
        // Do not put discord permission flags, put the names instead.
        "clientid:352604785364697091"
    ]);
  };

  async run(Client, Message, Args) {
    const Settings = getSettings();

    try {
      const reactionRoleChannelId = Settings.Options.AnnouncementChannels.ReactionRoles;
      const Channel = await Client.channels.fetch(reactionRoleChannelId);
      const Guild = await Channel.guild.fetch();
      const rrId = Math.random() * 100000;
      const rrId_p = rrId + 1;

      let optionData = [];
      let pronounOptions = [];

      for (const key in Settings.MentionRoles) {
        if (key.toLowerCase().includes('pronoun') || key.toLowerCase().includes('/') || key.toLowerCase().includes('removal')) {
          const option = Settings.MentionRoles[key];

          let emojiData = {
            Label: option.name,
            Value: option.id,
            Description: option.description,
          };
          
          if (option.emoji) {
            emojiData.Emoji = option.emoji;
          };

          pronounOptions.push(emojiData);
          
          if (!key.toLowerCase().includes('removal')) {
            continue;
          }
        };

        const option = Settings.MentionRoles[key];

        let emojiData = {
          Label: option.name,
          Value: option.id,
          Description: option.description,
        };
        
        if (option.emoji) {
          emojiData.Emoji = option.emoji;
        };

        optionData.push(emojiData);
      };

      CreateEmbed(Channel, `${Settings.Options.embedHeader} | Reaction Roles`, `If you'd like to receive roles that ping you for certain events, make sure to select the role you'd like to be alerted for.`, null, null, null, null, null, null, {
        Placeholder: "Claim your roles here!",
        Label: "Label",
        ID: `reactionroles_${rrId}`,
        Options: optionData,
        minValues: 1
      }, {
        useMenuV2: true
      });

      CreateEmbed(Channel, `${Settings.Options.embedHeader} | Pronouns`, `Be true to yourself! We welcome everyone at Bean House, therefore don't be hesitant to share your pronouns with the majority of us!`, null, null, null, null, null, null, {
        Placeholder: "Claim your pronouns here!",
        Label: "Label",
        ID: `reactionroles_${rrId_p}`,
        Options: pronounOptions,
        minValues: 1
      }, {
        useMenuV2: true
      });
    } catch(error) {
      console.error(error);
    };
  };
};

module.exports = Command; // Enable this to create the command.