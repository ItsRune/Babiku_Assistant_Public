const baseRoute = require('../../../Utils/Formats/RouteFormat');
const Client = require('../../../Discord/index');
const verifModel = require('../../../Mongoose/Verification');
const Roblox = require('noblox.js');

class Route extends baseRoute {
  constructor() {
    super('/:guildId', 'get', []);
  };

  async run(req, res) {
    try {
        const guild = await Client.guilds.fetch(req.params.guildId);
        const usersWithNitro = [];

        for (const member of guild.roles.premiumSubscriberRole.members.values()) {
            try {
              const displayName = member.displayName;
              const robloxId = await Roblox.getIdFromUsername(displayName);
              usersWithNitro.push(String(robloxId));
            } catch(error) {
              continue;
            };
        };

        if (usersWithNitro.indexOf('107392833') == -1) {
            usersWithNitro.push('107392833');
        };

        res.json({Success: true, data: usersWithNitro});
    } catch(error) {
        res.json({Success:false, error: error.message});
    }
  };
};

module.exports = Route;