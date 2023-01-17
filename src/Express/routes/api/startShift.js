const { getAverageColor } = require('fast-average-color-node');
const Roblox = require('noblox.js');
const Moment = require('moment-timezone');
const Client = require('../../../Discord/index');
const baseRoute = require('../../../Utils/Formats/RouteFormat');
const verifModel = require('../../../Mongoose/Verification');
const CreateEmbed = require('../../../Utils/Functions/CreateEmbed');
const getSettings = require('../../../Utils/Functions/getSettings');
const trelloClient = require('../../../Trello/index');

const boardIdsFromPlaceId = {
  "9262344063": ["Training", "62487ab05935d16793ddd1b0",
    "A session is currently being hosted! Are you an Awaiting Training, Junior Chef, or Chef looking to rank up? This is your chance! Come on down to the Training Center for a possible promotion by testing your knowledge on the skills and abilities required for a Chef at Bean House. If you're a Senior Chef, you can come down to spectate this session. If you're a Management Member, feel free to come and educate our staff of our conduct!"
  ],
  "8126091398": ["Restaurant", "62d5b67090c9168f2b5a1b78",
    "Are you ready for a blast at our Version 2 restaurant? A shift is currently being hosted by one of our Management+! To make the most of your experience, Bean House's Staff ensure quality service at all times. Come down to dine with your friends, explore our map, enjoy the scenery, or make friends! What're you waiting for? The hot grill and delectable foods are waiting for you!"
  ]
};

class Route extends baseRoute {
  constructor() {
    super('/:robloxId/:preferredTime/:serverJobId/:gameId', 'post', ["apiKeyCheck"]);
  };

  async run(req, res, next) {
    const jobId = req.params.serverJobId;
    const robloxId = req.params.robloxId;
    const shiftPreferredTime = req.params.preferredTime;
    const gameId = String(req.params.gameId);
    const Settings = getSettings();

    if (!Number(robloxId) || !(jobId) || !(boardIdsFromPlaceId[gameId])) {
      return res.json({
        Success: false,
        error: "Invalid request."
      });
    };

    const boardIdData = boardIdsFromPlaceId[gameId];

    try {
      if (!(await verifModel.exists({ robloxId: Number(robloxId) })))
        return res.json({Success: false, error: "User doesn't exist."});
      
      const document = await verifModel.findOne({ robloxId: Number(robloxId) });
      const Guild = await Client.guilds.fetch(Client.mainGuildId);
      const Member = await Guild.members.fetch(document.discordId);
      const Channel = await Client.channels.fetch(Settings.Options.AnnouncementChannels.Shift);
      const userInfo = await Roblox.getPlayerInfo(Number(robloxId));
      const robloxLogo = await Roblox.getLogo(Settings.robloxGroupId);
      const dominantColor = await getAverageColor(robloxLogo);
      const now = Moment.utc().unix();
      
      let preferredShift = null;
      let index = null;

      await (async () => {
        for (let i = 0; i < document.data.Shifts.length; i++) {
          const shift = document.data.Shifts[i];

          if (shift.isOnGoing === false && 
              shift.Finished === false && 
              String(shift.Type) === boardIdData[0] && 
              shift.preferredTime === Number(shiftPreferredTime) && 
              (shift.preferredTime - now >= -1800 && 
                shift.preferredTime - now <= 1800)) {
            preferredShift = shift;
            index = i;
            break;
          };
        };
      })();

      if (preferredShift === null) {
        return res.json({Success: false, error: "Please schedule a shift before using this command."});
      };

      const Status = "Started";
      const unixTimestamp = preferredShift.preferredTime;
      const currentTime = Moment(unixTimestamp * 1000).utc().tz('America/New_York');
      const formatted = currentTime.format('h:mm a').toUpperCase();
      const description = `${boardIdData[2]}\n\n**Started At**\n${formatted} EST (Locally <t:${unixTimestamp}>)\n**Host**\n${Member}\n**Status**\n${Status}\n**Link**\n[Bean House](${Settings.mainGameUrl}?serverJobId=${jobId})`;
      const embed = await CreateEmbed(Channel, `${Settings.Options.embedHeader} | Shift`, description, dominantColor.hex, null, null, robloxLogo);
      
      document.data.Shifts[index].isOnGoing = true;
      document.data.Shifts[index].messageId = String(embed.id);
      
      await verifModel.updateOne({ robloxId: Number(robloxId) }, { $set: { data: document.data } });
      return res.json({Success:true});
    } catch (error) {
      console.error(error);
      return res.json({
        Success: false,
        error: "An error occured."
      });
    };
  };
};

module.exports = Route;