const axios = require('axios');
const crypto = require('crypto');
const trelloClient = require('../index');
const Settings = require('../../../Settings.json');
const Moment = require('moment');
const uri = "https://apis.roblox.com/datastores/v1/universes/3469553051";
const entryKey = "admin";

async function sendFailedTrainingLogs() {
    return; // Disabled for now
    try {
        const response = await axios({
            method: "GET",
            url: uri + `/standard-datastores/datastore/entries/entry?datastoreName=failedToLog_Trainings&entryKey=${entryKey}`,
            headers: {
                "x-api-key": Settings.Roblox_ApiKey,
            }
        });
        const data = response.data;

        if (data.length > 0) {
            const format = "• [<USERNAME>](https://roblox.com/users/<USERID>/profile) - <ROLE> (<GROUPROLE>)"
            
            for (let i = 0; i < data.length; i++) {
                const formatted = [];
                const entry = data[i];
                const userInfo = entry[0];
                const time = entry[1];
                let host = "Unknown";

                for (let x = 0; x < userInfo.length; x++) {
                    const username = userInfo[x][0];
                    const userId = userInfo[x][1];
                    const GroupRole = userInfo[x][3];
                    const taskRole = userInfo[x][4];

                    if (taskRole == "Host") {
                        host = username;
                    };

                    const newlyFormatted = format.replace("<USERNAME>", username)
                    .replace("<USERID>", userId)
                    .replace("<ROLE>", taskRole)
                    .replace("<GROUPROLE>", GroupRole);
                    
                    if (!formatted.includes(newlyFormatted)) {
                        formatted.push(newlyFormatted);
                    };
                };

                try {
                    await trelloClient.addCard(
                        `Trainings | Host: ${String(host)} | Time: ${Moment(time).tz('America/New_York').format("HH:mm a")} EST`,
                        formatted.join("\n") + "\n\nSent using BeanHouse Assistant",
                        "62487ab05935d16793ddd1b0"
                    );
                    data.splice(i, 1);
                } catch(error) {
                    console.error(error);
                };
            };
        };

        try {
            const jsonData = JSON.stringify(data);
            const hashedData = crypto.createHash('md5').update(jsonData).digest('base64');
            const contentLength = Buffer.byteLength(jsonData);
            
            await axios.post(uri + `/standard-datastores/datastore/entries/entry?datastoreName=failedToLog_Trainings&entryKey=${entryKey}`, data, {
                headers: {
                    "x-api-key": Settings.Roblox_ApiKey,
                    "content-type": "application/json",
                    "content-length": contentLength,
                    "content-md5": hashedData,
                }
            });
        } catch(error) {
            console.error(error);
        };

        return Promise.resolve(true);
    } catch(error) {
        console.error(error.message);
    }
};

module.exports = sendFailedTrainingLogs;