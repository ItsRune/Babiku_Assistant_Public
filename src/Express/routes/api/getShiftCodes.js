const baseRoute = require('../../../Utils/Formats/RouteFormat');
const verifModel = require('../../../Mongoose/Verification');
const Moment = require('moment');

class Route extends baseRoute {
  constructor() {
    super('/', 'get', ["apiKeyCheck"]);
  };

  async run(req, res, next) {
    try {
      const documents = await verifModel.find();
      const now = Moment.tz('America/New_York').utc();
      const nowUnix = now.unix();
      const shiftsToSend = {};

      for (const i in documents) {
        const doc = documents[i];
        const data = doc.data;
        if (Object.keys(data).indexOf('Shifts') === -1 || data.Shifts.length === 0) continue;

        for (const j in data.Shifts) {
          const shift = data.Shifts[j];

          if (shift.Finished === false && 
            shift.isOnGoing === false &&
            shift.preferredTime - nowUnix >= -1800 && 
            shift.preferredTime - nowUnix <= 1800) {

            if (!(doc.robloxId in shiftsToSend)) {
              shiftsToSend[String(doc.robloxId)] = [];
            };

            shiftsToSend[doc.robloxId].push(shift);
          };
        };
      };

      // console.log(shiftsToSend);
      res.json({Success: true, data: shiftsToSend});
    } catch (error) {
      console.error(error);
      res.json({Success: false, error: error.message});
    }
  };
};

module.exports = Route;