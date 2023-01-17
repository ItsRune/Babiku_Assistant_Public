const Settings = require('../../../Settings.json');

function keyCheck(req, res, next) {
    const headers = req.headers;
    const keys = Object.keys(headers);

    if (keys.indexOf('x-api-key') === -1 || headers['x-api-key'] !== Settings.Local_ApiKey) {
        return res.json({Success:false, errorMessage: "Not authorized."});
    };

    next();
};

module.exports = keyCheck;