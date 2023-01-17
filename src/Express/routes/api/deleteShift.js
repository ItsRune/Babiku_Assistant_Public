const Moment = require('moment-timezone');
const Client = require('../../../Discord/index');
const getSettings = require('../../../Utils/Functions/getSettings');
const { getCurrentWeek } = require('../../../Utils/Functions/getCurrentWeek');
const baseRoute = require('../../../Utils/Formats/RouteFormat');
const verifModel = require('../../../Mongoose/Verification');
const shiftModel = require('../../../Mongoose/Shift');
const trelloClient = require('../../../Trello/index');
const calculateTime = require('../../../Utils/Functions/calculateTime');

const boardIdsFromPlaceId = {
    "9262344063": ["Training", "62487ab05935d16793ddd1b0"],
    "8126091398": ["Restaurant", "62d5b67090c9168f2b5a1b78"]
};

class Route extends baseRoute {
    constructor() {
        super('/:robloxId/:preferredTime', 'delete', ["apiKeyCheck"]);
    };

    async run(req, res, next) {
        const Settings = getSettings();
        const Body = req.body;
        const bodyKeys = Object.keys(Body);

        if (!Number(req.params.robloxId) || !Number(req.params.preferredTime)) {
            return res.json({
                Success: false,
                error: "Invalid request."
            });
        };

        if (bodyKeys.indexOf('gameId') === -1) {
            return res.json({
                Success: false,
                error: "Invalid request."
            });
        };
        
        const robloxId = Number(req.params.robloxId);
        const preferredTime = Number(req.params.preferredTime);
        const boardIdData = boardIdsFromPlaceId[Body.gameId];

        try {
            if (!(await verifModel.exists({ robloxId })))
                return res.json({Success: false, error: "User doesn't exist."});
            
            const currentWeekTime = (getCurrentWeek()).start;
            const shiftData = await shiftModel.findOne({ startWeek: Number(currentWeekTime) });
            const document = await verifModel.findOne({ robloxId });
            const Channel = await Client.channels.fetch(Settings.Options.AnnouncementChannels.Shift);
            const documentKeys = Object.keys(document.data);
            const timeFormat = Moment(preferredTime * 1000).tz('America/New_York').format('h:mm a');
            const nowFormat = Moment().tz('America/New_York').format('h:mm a');

            if (documentKeys.indexOf('Shifts') === -1) {
                return res.json({Success: false, error: "User doesn't have any shifts."});
            };

            let Message;
            let currentShift = null;
            let index = 0;
            for (let i = 0; i < document.data.Shifts.length; i++) {
                const Shift = document.data.Shifts[i];
                
                if (Shift.preferredTime === preferredTime) {
                    currentShift = Shift;
                    index = i;
                    break;
                };
            };

            try {
                Message = await Channel.messages.fetch(currentShift.messageId);
            } catch(err) {};

            if (Message) {
                await Message.delete();
            };

            if (boardIdData[0] === "Training") {
                if (bodyKeys.indexOf('attendance') === -1) {
                    return res.json({
                        Success: false,
                        error: "Invalid request."
                    });
                };

                const attendance = Body.attendance;
                const format = "+ [<USERNAME>](https://roblox.com/users/<USERID>/profile) - <ROLE> (<GROUPROLE>)"
                let formatted = "";
                let host;
                
                for (let i = 0; i < attendance.length; i++) {
                    const userInfo = attendance[i];
                    const username = userInfo[0];
                    const userId = userInfo[1];
                    const userRole = userInfo[2];
                    const userOHRole = userInfo[3];

                    if (userRole.toLowerCase().indexOf("customer") !== -1 && userOHRole.toLowerCase().indexOf("ambassador") !== -1 && userOHRole.toLowerCase().indexOf("train") !== -1) {
                        let theirCurrentAttendance = shiftData.data[String(userId)];

                        if (!theirCurrentAttendance) {
                            theirCurrentAttendance = [0, 0];
                        };

                        theirCurrentAttendance[1]++;
                        shiftData.data[String(userId)] = theirCurrentAttendance;
                    };

                    if (String(userOHRole).toLowerCase() == "host") {
                        host = username;
                    }

                    const newlyFormatted = format
                    .replace("<USERNAME>", username)
                    .replace("<USERID>", userId)
                    .replace("<ROLE>", userOHRole)
                    .replace("<GROUPROLE>", userRole)

                    if (!formatted.includes(newlyFormatted)) {
                        formatted += `\n + ${newlyFormatted}`;
                    };
                };
                
                try {
                    if (Settings.Debug) {
                        await trelloClient.addCard(`Training | Host: ${host} | Time: ${timeFormat} EST`, `${formatted}`, boardIdData[1]);
                    };
                } catch(error) {
                    console.log(error);
                    return res.json({Success: false, error: "Failed to add card to Trello."});
                };
            } else if (boardIdData[0] === "Restaurant") {
                if (bodyKeys.indexOf('attendance') === -1) {
                    return res.json({
                        Success: false,
                        error: "Invalid request."
                    });
                };
                const attendance = Body.attendance;
                const afkLogs = attendance.Afk;
                const users = attendance.Users;
                const whenJoined = attendance.whenJoin;

                // Formats \\
                const startAndFinishTime = "+ Start: <STARTTIME>\n+ Finish: <FINISHTIME>\n";
                const afkFormat = "\n + Spent AFK: <TIME>\n + Spent In-Game: <ingameTIME>";
                const joinedFormat = "\n + First Joined: <TIME>";
                const format = "+ [<USERNAME>](https://roblox.com/users/<USERID>/profile) - <GROUPROLE>"
                // End Formats \\
                
                let loggedAfk = {};
                let loggedJoins = {};
                let host;
                let finallyFormatted = "";

                for (let i = 0; i < whenJoined.length; i++) {
                    loggedJoins[whenJoined[i][0]] = whenJoined[i][1];
                };

                for (let i = 0; i < afkLogs.length; i++) {
                    const afkLog = afkLogs[i];
                    const userId = afkLog[0];
                    const logs = afkLog[1];
                    const firstJoined = loggedJoins[userId];
                    let secondsSpent = 0;

                    for (let a = 0; a < logs.length; a++) {
                        secondsSpent += (logs[a][1] - logs[a][0]);
                    };

                    const formattedSeconds = calculateTime(secondsSpent);
                    const formattedJoin = (firstJoined) ? calculateTime(Math.floor(Date.now() / 1000) - (firstJoined[0][0] - secondsSpent)) : "Unknown";

                    loggedAfk[userId] = [formattedSeconds, formattedJoin];
                };

                if (!shiftData["data"]) {
                    shiftData.data = {};
                };

                for (let i = 0; i < users.length; i++) {
                    const user = users[i];
                    const username = user[0];
                    const userId = user[1];
                    const userRole = user[2];
                    const userAfk = loggedAfk[userId];
                    const userJoin = loggedJoins[userId];

                    if (userRole.toLowerCase().indexOf("customer") === -1 && userRole.toLowerCase().indexOf("ambassador") === -1 && userRole.toLowerCase().indexOf("train") === -1) {
                        console.log('got here')
                        let theirCurrentAttendance = Object.keys(shiftData.data).indexOf(String(userId)) !== -1 ? shiftData.data[String(userId)] : [0, 0];

                        theirCurrentAttendance[0]++;
                        shiftData.data[String(userId)] = theirCurrentAttendance;
                    };

                    let formatted = format
                    .replace("<USERNAME>", username)
                    .replace("<USERID>", userId)
                    .replace("<GROUPROLE>", userRole);

                    if (Number(userId) == Number(robloxId)) {
                        host = username;
                    };

                    if (userAfk) {
                        const newlyFormatted = afkFormat.replace("<TIME>", userAfk[0]).replace("<ingameTIME>", userAfk[1]);
                        formatted += newlyFormatted;
                    };

                    if (userJoin) {
                        const newlyFormatted = joinedFormat.replace("<TIME>", Moment(userJoin[0][0]).tz('America/New_York').format('h:mm a'));
                        formatted += newlyFormatted;
                    };

                    finallyFormatted += `${formatted}\n`;
                };

                const timeFormatted = startAndFinishTime
                .replace("<STARTTIME>", timeFormat)
                .replace("<FINISHTIME>", nowFormat);
                
                try {
                    if (!Settings.Debug) {
                        await trelloClient.addCard(`Shift | Host: ${host} | Time: ${timeFormat} EST`, `${timeFormatted}\n---\n${finallyFormatted}`, boardIdData[1]);
                    };
                } catch(error) {
                    console.log(error);
                    return res.json({Success: false, error: "Failed to add card to Trello."});
                };
            };

            document.data.Shifts.splice(index + 1, 1);
            await shiftModel.updateOne({ startWeek: Number(currentWeekTime) }, { $set: { data: shiftData.data } });
            await verifModel.updateOne({ robloxId: Number(req.params.robloxId) }, { $unset: { data: document.data } });
            return res.json({Success: true});
        } catch (error) {
            console.error(error);
            res.json({ Success: false, error: error.message });
        }
    };
};

module.exports = Route;