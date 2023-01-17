const c = require('canvas');
const path = require('path');
const Roblox = require('noblox.js');
const Client = require('../../Discord/index');
const getSettings = require('./getSettings');
const { loadImage, createCanvas } = c;

async function generateProfile(userData) {
    const Settings = getSettings();
    let background;
    let watermark;
    let profilePicture;
    let txt;
    let robloxInfo;
    let groupRank;
    let discordUser;
    
    try {
        background = await loadImage(path.join(__dirname, '../../../Photos/profile_background.png'));
    } catch(error) {}

    try {
        watermark = await loadImage(path.join(__dirname, '../../../Photos/babiku_logo.png'));
    } catch(error) {}

    try {
        discordUser = await Client.users.fetch(userData.discordId);
    } catch(error) {}

    try {
        const pfp = await Roblox.getPlayerThumbnail(Number(userData.robloxId), "420x420", "png", true, "headshot");
        profilePicture = await loadImage(pfp[0].imageUrl);
    } catch(error) {}

    try {
        robloxInfo = await Roblox.getPlayerInfo(Number(userData.robloxId));
        groupRank = await Roblox.getRankInGroup(Number(Settings.robloxGroupId), Number(userData.robloxId));
    } catch(error) {}
    
    const canvas = createCanvas(background.width, background.height);
    const ctx = canvas.getContext('2d');
    const mainX = 400;

    const pfpPositionX = canvas.width / 6 - 47;
    const pfpPositionY = canvas.height / 6 - 25
    let nextYPos = 0;

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(watermark, canvas.width - 110, canvas.height - 90, 120, 120);

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold underline 32px sans-serif';
    txt = ctx.measureText(`${Settings.Options.embedHeader} | Profile`);
    ctx.fillText(`${Settings.Options.embedHeader} | Profile`, mainX - 10, pfpPositionY + 32, canvas.width);
    ctx.fillText("___________", mainX - 9.5, pfpPositionY + 32, canvas.width);
    nextYPos = 56;

    ctx.font = 'bold 18px sans-serif';
    txt = ctx.measureText(robloxInfo.username);
    ctx.fillText("Roblox username: " + robloxInfo.username, mainX - 35 + (txt.width / 2), pfpPositionY + nextYPos, canvas.width);
    nextYPos += 20;

    txt = ctx.measureText(userData.robloxId);
    ctx.fillText("Roblox userid: " + userData.robloxId, mainX - 52 + (txt.width / 2), pfpPositionY + nextYPos, canvas.width);
    nextYPos += 20;

    if (discordUser) {
        txt = ctx.measureText(`@${discordUser.tag}`);
        ctx.fillStyle = "#738cff"
        ctx.fillText("Verified To: " + `@${discordUser.tag}`, mainX - 53 + (txt.width / 2), pfpPositionY + nextYPos, canvas.width);
        nextYPos += 20;
    };

    ctx.fillStyle = "#fff";

    //-- Shift Data --\\
    if (groupRank && groupRank >= Settings.Options.GroupRanks.LR) {
        ctx.fillText("Group Rank: " + groupRank, mainX - 53, pfpPositionY + nextYPos, canvas.width);
        nextYPos += 20;
    };

    //- Profile picture -\\
    ctx.fillStyle = '#ddd';
    ctx.beginPath();
    ctx.arc(canvas.width / 4 - 50, canvas.height / 4, canvas.width / 12 - 10, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.clip();
    ctx.drawImage(profilePicture, pfpPositionX + 2.5, pfpPositionY + 2, canvas.width / 6.5, canvas.width / 6.5);
    ctx.closePath();
    ctx.restore();

    return canvas.toBuffer();
};

// const b = generateProfile({
//     robloxId: 107392833,
//     discordId: '352604785364697091',
//     verifiedAt: 'July 16th 2022, 4:09:14 am EST',
// });

// b.then((buffer) => {
//     const fs = require('fs');
//     fs.writeFileSync('./profile_example.png', buffer);
// });

module.exports = generateProfile;