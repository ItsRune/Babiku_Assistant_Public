const verifModel = require('../../../Mongoose/Verification');
const CommandFormat = require('../../../Utils/Formats/CommandFormat');
const Sleep = require('../../../Utils/Functions/Sleep');
const Roblox = require('noblox.js');
const CreateEmbed = require('../../../Utils/Functions/CreateEmbed');
const calculateTime = require('../../../Utils/Functions/calculateTime');
const { Guild } = require('discord.js');

class Command extends CommandFormat {
  constructor() {
    // Cmd Name, Cmd Description, Alias, Usage, canBeUsedInDms, isSlashCommand, Permissions
    super('forceverify', 'Forces verification on all members.', ['force'], '', false, false, [
        "clientid:352604785364697091",
        "requiresall"
    ]);
  };

  async #verifyUser(Member, robloxID) {
    const newDoc = new verifModel({
        discordId: String(Member.id),
        robloxId: Number(robloxID),
    });

    return (await newDoc.save()) ? true : false;
  };

  async #recurrsiveCheck(Members) {
    let index = 0;
    let failed = 0;
    let success = 0;
    let alreadyExisted = 0;
    let errors = {};

    for (const [_, member] of Members.entries()) {
        if (index != 0 && index % 5 === 0) {
            await Sleep(30_000);
        };

        if (!member.nickname) {
          continue;
        };

        if (await verifModel.exists({ discordId: String(member.id) })) {
          alreadyExisted++;
          continue;
        }
    
        try {
          const robloxId = await Roblox.getIdFromUsername((member.nickname) ? member.nickname : member.user.username);
          let good = await this.#verifyUser(member, robloxId);
  
          if (good) {
              success++;
          } else {
              failed++;
          };
        } catch(error) {
          if (Object.keys(errors).indexOf(error.message) === -1) {
            errors[error.message] = 1;
          } else {
            errors[error.message]++;
          };

          failed++;
        }
    
        index++;
    };

    return {success, failed, alreadyExisted, errors};
  };

  async verifyGuild(Client, Message, guildId) {
    try {
      const Guild = await Client.guilds.fetch(guildId);
      const members = await Guild.members.fetch();
      const timeWillTake = (members.size / 5) * 30;
      const newMessage = await CreateEmbed(Message, `Verifying ${members.size} members... This will take roughly \`${calculateTime(timeWillTake)}\`.`);
      const { success, failed, alreadyExisted, errors } = await this.#recurrsiveCheck(members.filter(m => m.user.bot === false && m.roles.cache.find(r => r.name === 'Verified')));

      const embed = newMessage.embeds[0];
      embed.description = `Verification complete!\n\n${success} member(s) were successfully verified.\n${failed} members weren't able to be verified!\n${alreadyExisted} members already have verification data.\n\n\`\`\`json\n${JSON.stringify(errors, null, 2)}\n\`\`\``;

      await newMessage.edit({embeds: [embed]});
    } catch(error) {
        console.error(error);
    };
  };

  async run(Client, Message, Args) {
    if (!Args[0]) {
      guildId = Message.guild.id;
      this.verifyGuild(Client, Message, guildId);
    } else {
      const guild = await Client.guilds.fetch(Message.guild.id);

      if (guild instanceof Guild) {
        const guildId = Args[0];
        this.verifyGuild(Client, Message, guildId);
      } else {
        if (!Number(Args[1])) return;
        const target = await Message.guild.members.fetch(Args[0]);
        const exists = await verifModel.exists({ discordId: String(target.id) });

        if (exists) {
          await verifModel.updateOne({ discordId: String(target.id) }, { $set: {robloxId: Number(Args[1])} });
        } else {
          this.#verifyUser(target, Number(Args[1]));
        }
      };
    };
  };
};

module.exports = Command; // Enable this to create the command.