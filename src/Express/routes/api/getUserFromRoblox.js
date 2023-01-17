const baseRoute = require('../../../Utils/Formats/RouteFormat');

class Route extends baseRoute {
  constructor() {
    super('/:robloxId', 'get', []);
  };

  async run(req, res, next) {
    const params = req.params;
    res.json(params);
  };
};

module.exports = Route;