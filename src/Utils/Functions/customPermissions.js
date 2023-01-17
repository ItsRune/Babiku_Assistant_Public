const Discord = require('discord.js');
const Roblox = require('noblox.js');

// Only pass Message and Members!
async function hasPermission(Message, Permissions, Guild) {
  const Settings = require('../../../Settings.json');

  const Member = (Message instanceof Discord.Message) ? Message.member : Message;
  const GroupId = Settings.robloxGroupId;

  let goodToRun = 0;
  let requiresAll = false;
  Guild = (!Guild) ? Message.guild : Guild;

  if (!Member) {
    return false;
  }

  for (let i = 0; i < Permissions.length; i++) {
    let permName = String(Permissions[i]);

    if (permName.toLowerCase().includes("clientid")) {
      let idNeeded = permName.toLowerCase().split(":")[1];

      if (String(Member.id) === idNeeded) {
        goodToRun++;
      }
    } else if (permName.toLowerCase().includes("guildid")) {
      let idNeeded = permName.toLowerCase().split(":")[1];

      if (String(Guild.id) === idNeeded) {
        goodToRun++;
      }
    } else if (permName.toLowerCase().includes("ownership")) {
      if (Guild.ownerId === Member.id) {
        goodToRun++;
      }
    } else if (permName.toLowerCase().includes('channelid')) {
      const ChannelId = permName.toLowerCase().split(":")[1];

      if (String(Message.channel.id) == String(ChannelId)) {
        goodToRun++;
      }
    } else if (permName.toLowerCase().includes('verified')) {
      if (Object.keys(Message).indexOf('userInformation') != -1) {
        goodToRun++;
      }
    } else if (permName.toLowerCase().includes('rank')) {
      const split = permName.toLowerCase().split(":");
      const rankToCheckFor = Number(split[1]) || 10;
      const tolerance = split[2] || ">=";
      const theirData = (Object.keys(Message).indexOf('userInformation') != -1) ? Message.userInformation : null;

      if (theirData == null) {
        continue;
      };
      
      try {
        const rank = await Roblox.getRankInGroup(GroupId, Number(theirData.robloxId));
      
        switch (tolerance) {
          case ">=":
            if (rank >= rankToCheckFor) {
              goodToRun++;
            };
            break;
          case ">":
            if (rank > rankToCheckFor) {
              goodToRun++;
            };
            break;
          case "<=":
            if (rank <= rankToCheckFor) {
              goodToRun++;
            };
            break;
          case "<":
            if (rank < rankToCheckFor) {
              goodToRun++;
            };
            break;
          default:
            if (rank === rankToCheckFor) {
              goodToRun++;
            };
            break;
        };
      } catch(error) {
        console.error(error);
        continue;
      }

    } else if (permName.toLowerCase().includes('requiresall')) {
      requiresAll = true;
      goodToRun++;
    } else if (Member.permissions.has(Discord.Permissions.FLAGS[String(Permissions[i]).toUpperCase()])) {
      goodToRun++;
    };
  };
  
  if (requiresAll) {
    return (goodToRun === Permissions.length);
  };

  if (Permissions.length > 0 && goodToRun > 0) {
    return true;
  } else if (Permissions.length === 0) {
    return true;
  }

  return false;
}

module.exports = hasPermission;