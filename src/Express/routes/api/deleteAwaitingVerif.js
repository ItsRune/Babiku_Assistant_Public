const baseRoute = require('../../../Utils/Formats/RouteFormat');
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../../../Files/verificationKeys.json');
const verifModel = require('../../../Mongoose/Verification');

class Route extends baseRoute {
  constructor() {
    super('/:robloxId', 'delete', []);
  };

  async run(req, res, next) {
    try {
        const { robloxId } = req.params;
        const currentContents = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        if (await verifModel.exists({robloxId: String(robloxId)}) === false)
            throw new Error("No supplied roblox userid.");

        if (currentContents.filter(c => String(c.userId) === String(robloxId)).length === 0)
            throw new Error("That roblox user id has not triggered the verification command yet.");
        
        for (let i = 0; i < currentContents.length; i++) {
            if (String(currentContents[i].userId) === String(robloxId)) {
                const foundIndex = currentContents.findIndex(c => String(c.userId) === String(robloxId));
                currentContents.splice(foundIndex, 1);
            };
        };

        fs.writeFileSync(filePath, JSON.stringify(currentContents), 'utf-8');
        res.json({Success: true});
    } catch(error) {
        res.json({Success:false, error: error.message});
    }
  };
};

module.exports = Route;