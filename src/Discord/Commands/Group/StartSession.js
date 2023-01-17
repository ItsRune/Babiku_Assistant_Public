const verifModel = require('../../../Mongoose/Verification');
const CommandFormat = require('../../../Utils/Formats/CommandFormat');
const CreateEmbed = require('../../../Utils/Functions/CreateEmbed');
const { standardTimes, convertTimeToEST } = require('../../../Utils/Functions/convertTimeToEST');

class Command extends CommandFormat {
  constructor() {
    // Cmd Name, Cmd Description, Alias, Usage, canBeUsedInDms, isSlashCommand, Permissions
    super('startshift', 'Starts a shift with the given time, then will auto announce it.', ['shift'], '[Minutes Planned]', true, false, [
        // Do not put discord permission flags, put the names instead.
        "rank:32:>="
    ]);
  };

  convertTimezonesToHelp() {
    let timezones = "";
    for (const i in standardTimes) {
      timezones += `\n\`${i}\` - ${standardTimes[i].split("/")[1].replace("_", " ")}`;
    }
    return timezones;
  }

  async run(Client, Message, Args) {
    if (!Message.userInformation) return;
    switch(Args[0]) {
      case "help":
        CreateEmbed(Message, `${Settings.Options.embedHeader} | Shifts`, `This command uses timezones to allow for all members around the world to host shifts with ease. This is a the list of valid timezones:\n\n(More timezones will soon be added.)${this.convertTimezonesToHelp()}\n\nExample: \`${Client.Prefix}${this.name} 3:30 pm pst\` - This will be converted to 6:30 pm EST.\nNote: If you don't put \`pst\` it'll automatically be \`est\`\n\nTo start a training shift, please add \`training\` at the end of your timezone.\nExample: \`${Client.Prefix}${this.name} 3:30 pm pst training\` - Without training it will instead be hosted at the restaurant.`);
        break;
      default:
        const { TimeEST, TimeString, TimeUnix } = convertTimeToEST(Args, true);
        // Nothing is wrong with the logic above.

        try {
          let shiftType;
          if (Args.length > 0) {
            for (const i in Args) {
              if (String(Args[i]).toLowerCase().match("train") != null) {
                shiftType = "Training";
              };
            };

            if (!shiftType)
              shiftType = "Restaurant";
          }

          const document = Message.userInformation;
          if (Object.keys(document.data).indexOf('Shifts') === -1) {
            document.data.Shifts = [];
          };

          document.data.Shifts.push({
            preferredTime: TimeUnix,
            isOnGoing: false,
            Finished: false,
            Type: shiftType
          });

          await verifModel.updateOne({ discordId: String(Message.member.id) }, { data: document.data });
          return await CreateEmbed(Message, `${Settings.Options.embedHeader} | Shift`, `Your \`${shiftType}\` shift has been scheduled for **${TimeString} EST**\n(<t:${TimeUnix}>).`,
          null, null, null, null, null, null, null, {
            reply: true
          });
        } catch(error) {
          console.error(error);
          return CreateEmbed(Message, `${Settings.Options.embedHeader} | Shift`, `There was an error scheduling your shift:\n\n${error.message}`,
          null, null, null, null, null, null, null, {
            reply: true
          });
        };
        break;
      };
    };
};

module.exports = Command; // Enable this to create the command.