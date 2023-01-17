const baseRoute = require('../../../Utils/Formats/RouteFormat');
const fs = require('fs');
const path = require('path');

class Route extends baseRoute {
  constructor() {
    super('/', 'get', []);
  };

  async run(req, res, next) {
    try {
        const contents = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../Files/verificationKeys.json'), 'utf-8'));
        res.json({Success: true, data: contents});
    } catch(error) {
        res.json({Success:false, error: error.message});
    }
  };
};

module.exports = Route;