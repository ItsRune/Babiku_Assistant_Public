const axios = require('axios');
const Mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Roblox = require('noblox.js');
const getSettings = require("./getSettings");
const verifModel = require('../../Mongoose/Verification');
const pathToFile = path.join(__dirname, '../../Files/currentRobloxUsers.json');

async function updateGroupUsers() {
    const fileContents = require(pathToFile);    
    const Settings = getSettings();
    
    let nextCursor = "None";
    let cachedCursors = [];
    let updated;
    let startedAt = Date.now();
    let loopingCount = 0;

    if (fileContents[0] != null && Date.now() - fileContents[0] < (60 * 60) * 1000) return;
    
    while (nextCursor != null) {
        let link = `https://groups.roblox.com/v1/groups/${Settings.robloxGroupId}/users?sortOrder=Asc&limit=100`

        if (nextCursor != "None") {
            link += `&cursor=${nextCursor}`;
        };

        // Hacky solution to prevent mongoose buffering timeout:
        try { await Mongoose.connect(Settings.MongooseUri); } catch(e) {}

        try {
            const x = await axios.get(link);
            updated = (updated != null) ? updated : [Date.now(), []];
            
            for (const i in x.data.data) {
                const user = x.data.data[i].user;
                const role = x.data.data[i].role;

                let exists = (updated[1].filter(u => u.userId === user.userId)).length > 0;
                if (exists) continue;
                
                const hasData = await verifModel.exists({ robloxId: Number(user.userId) });
                if (!hasData) continue;
                const userData = await verifModel.findOne({ robloxId: Number(user.userId) });
                
                user.groupRole = role;
                user.verification = userData;
                
                updated[1].push(user);
            };

            if (cachedCursors.indexOf(x.data.nextPageCursor) === -1) {
                cachedCursors.push(x.data.nextPageCursor);
            };
            
            nextCursor = x.data.nextPageCursor;
        } catch(error) {
            console.error(error.message);
            setTimeout(() => {}, 5000);
            loopingCount += 1;

            if (loopingCount >= 10) {
                break;
            };

            continue;
        };
        
        if (nextCursor != null) {
            setTimeout(() => {}, 5000);
        };
    };

    if (updated != null) {
        fs.writeFileSync(pathToFile, JSON.stringify(updated), 'utf8');
        return updated;
    };

    return updated, Date.now() - startedAt;
};

async function calculateUpdateTime() {
    const Settings = getSettings();
    try {
        const groupInfo = await Roblox.getGroup(Number(Settings.robloxGroupId));
        return Math.ceil(groupInfo.memberCount / 100) * 5;
    } catch(e) {
        return Promise.reject(e);
    }
};

updateGroupUsers();

module.exports = {
    updateGroupUsers,
    calculateUpdateTime
};