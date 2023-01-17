const Client = require('../../../Discord/index');
const Discord = require('discord.js');
const Roblox = require('noblox.js');
const baseRoute = require('../../../Utils/Formats/RouteFormat');
const verifModel = require('../../../Mongoose/Verification');
const CreateEmbed = require('../../../Utils/Functions/CreateEmbed');
const getSettings = require('../../../Utils/Functions/getSettings');
const formatTime = require('../../../Utils/Functions/formatTime');

class Route extends baseRoute {
  constructor() {
    super('/', 'post', ["apiKeyCheck"]);
  };

  async run(req, res, next) {
    const Settings = getSettings();
    const body = req.body;
    const UserId = Number(body.UserId);
    const Answers = body.Answers;
    const Application = body.App;

    try {
        let userVerif = null;
        let fields = [];
        if (await verifModel.exists({ robloxId: UserId })) {
            userVerif = await verifModel.findOne({ robloxId: UserId });
        };

        const appKeys = Object.keys(Application);
        let outOf = 0;
        let correct = 0;
        for (const i in appKeys) {
            const question = appKeys[i];
            const isMultipleChoice = Answers[question] !== undefined;

            if (isMultipleChoice) {
                if (Answers[question] === Application[question]) {
                    correct += 1;
                };
                outOf += 1;
            } else {
                fields.push({
                    name: question,
                    value: Application[question],
                    inline: true
                });
            };
        };

        let timeFormatted = null;
        if (body.TimeTaken) {
            timeFormatted = formatTime(body.TimeTaken);
        };

        const robloxUser = await Roblox.getPlayerInfo(UserId);
        const channel = await Client.channels.fetch(Settings.Options.AnnouncementChannels.Applications);
        const description = `**User Information**${(userVerif) ? `\nDiscord: <@${userVerif.discordId}>` : ""}\nRoblox: [${(robloxUser.displayName) ? `${robloxUser.displayName} | ` : ``}${robloxUser.username}](https://roblox.com/users/${UserId}/profile)${(timeFormatted) ? `\nTime Spent on App: ${timeFormatted}` : ""}\n\nMultiple choice score: ${correct}/${outOf}`;
        
        await CreateEmbed(channel, `Application`, description, null, fields);
        res.json({Success: true})
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            Success: false,
            message: "Internal server error"
        });
    }
  };
};

module.exports = Route;