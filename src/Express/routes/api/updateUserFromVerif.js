const baseRoute = require('../../../Utils/Formats/RouteFormat');
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../../../Files/verificationKeys.json');
const verifModel = require('../../../Mongoose/Verification');

class Route extends baseRoute {
  constructor() {
    super('/:robloxId/:discordId', 'post', []);
  };

  async run(req, res, next) {
    try {
        const { robloxId, discordId } = req.params;
        const { response } = req.body;
        const currentContents = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        if (response === "no") {
            for (let i = 0; i < currentContents.length; i++) {
                if (String(currentContents[i].userId) === String(robloxId) && String(currentContents[i].discordInfo.id) === String(discordId)) {
                    currentContents.splice(i, 1);
                };
            };
            
            fs.writeFileSync(filePath, JSON.stringify(currentContents), 'utf-8');
            return res.json({Success:true, data:"Removed"});
        };

        if (await verifModel.exists({robloxId: Number(robloxId)}) === true || await verifModel.exists({discordId: String(discordId)}) === true)
            throw new Error("No supplied roblox userid.");

        if (currentContents.filter(c => String(c.userId) === String(robloxId)).length === 0)
            throw new Error("That roblox user id has not triggered the verification command yet.");
        
        for (let i = 0; i < currentContents.length; i++) {
            if (String(currentContents[i].userId) === String(robloxId) && String(currentContents[i].discordInfo.id) === String(discordId)) {
                currentContents.splice(i, 1);
            };
        };

        const document = new verifModel({
            discordId: String(discordId),
            robloxId: Number(robloxId)
        });
        await document.save();

        fs.writeFileSync(filePath, JSON.stringify(currentContents), 'utf-8');
        res.json({Success: true, data: document});
    } catch(error) {
        res.json({Success:false, error: error.message});
    }
  };
};

module.exports = Route;