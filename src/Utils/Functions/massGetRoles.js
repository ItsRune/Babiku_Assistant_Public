const verifModel = require('../../Mongoose/Verification');
const getGroupRoles = require('./getGroupRoles');
const fs = require('fs');
const path = require('path');
const getSettings = require('./getSettings');

async function Sleep(ms) {
    return new Promise(res => {
        setTimeout(res, ms);
    });
}

async function massGetRoles(Targets, Guild) {
    const Settings = getSettings();
    const current = fs.readFileSync(path.join(__dirname, '../../Files/massRoleFetchWorking.txt'), 'utf8');
    if (current === "true") return [null, null];

    let index = 1;
    let secondIndex = 1;
    let successful = 0;
    let failed = 0;
    let timeElapsed = Date.now();

    for (let i = 0; i < Targets.length; i++) {
        const thisTarget = Targets[i];

        try {
            if (await verifModel.exists({discordId: thisTarget.id}) === false) continue;
            const doc = await verifModel.findOne({discordId: thisTarget.id});
            await getGroupRoles(thisTarget, Guild, doc.robloxId, Settings.robloxGroupId);
            successful++;
        } catch(error) {
            failed++;
        }

        if (index % 50 === 0) {
            await Sleep(1500);
        };

        if (secondIndex % 100 === 0 && Date.now() - timeElapsed < 60000) {
            await Sleep(60500);
            timeElapsed = Date.now();
        };

        index++;
        secondIndex++;
    };
    
    fs.writeFileSync(path.join(__dirname, '../../Files/massRoleFetchWorking.txt'), "false", 'utf8');
    return [successful, failed];
};

module.exports = massGetRoles;