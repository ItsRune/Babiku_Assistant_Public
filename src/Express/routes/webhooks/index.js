const baseRoute = require('../../../Utils/Formats/RouteFormat');
const axios = require('axios');

class Route extends baseRoute {
  constructor() {
    super('/:tokenId/:token', 'post', []);
  };

  async run(req, res, next) {
    const params = req.params;
    const body = req.body;
    const newUrl = `https://discord.com/api/webhooks/${params.tokenId}/${params.token}`;

    axios.post(newUrl, body).then((response) => {
      res.json(response);
    }).catch((err) => {
      res.json(err);
    });
  };
};

module.exports = Route;