const baseRoute = require('../../../Utils/Formats/RouteFormat');
const Trello = require('../../../Trello/index');
const Moment = require('moment-timezone');

class Route extends baseRoute {
  constructor() {
    super('/', 'post', ["apiKeyCheck", "headerCheck"]);
  };

  async run(req, res, next) {
    const body = req.body;
    const hostUser = (Object.keys(body).indexOf("host") !== -1) ? body.host : "Unknown";

    try {
        const titleOfCard = `Trainings | Host: ${hostUser} | Time: ${Moment().tz("America/New_York").format("h:mm a")} EST`;
        let descOfCard = [];

        for (const i in body.attendance) {
            const user = body.attendance[i];
            descOfCard.push(`• [${user.name}](https://roblox.com/users/${user.id}/profile) - ${String(user.role).length === 1 ? `Group ${user.role}` : user.role} (${user.grouprole})`);
        };

        await Trello.addCard(titleOfCard, descOfCard.join("\n"), "62487ab05935d16793ddd1b0");
        res.json({Success: true});
    } catch(error) {
        console.error(error);
        res.json({Success:false, error: error.message});
    }
  };
};

module.exports = Route;