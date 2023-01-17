const { GuildMember, Guild } = require('discord.js');
const Roblox = require('noblox.js');
const Client = require('../../Discord');
const getSettings = require('./getSettings');

/**
 * Returns a role that matches all the parameters given.
 * @param {Guild} guild the guild to get the role from. 
 * @param {string} roleName the name of the role to get.
 * @param {boolean} createNew if the role does not exist, create it.
 * @returns {Promise<Role>}
 */
async function getRoleByName(guild, roleName, createNew=true) {
    try {
        const roles = await guild.roles.fetch();
        let role = null;

        roles.forEach((ROLE) => {
            if (String(ROLE.name).toLowerCase() === String(roleName).toLowerCase()) {
                role = ROLE;
            };
        });

        if (role == null && createNew == true) {
            try {
                const newRole = await guild.roles.create({
                    name: roleName,
                    color: 0xffffff,
                    reason: "Required for verification."
                });

                return newRole;
            } catch(error) {
                return error.message;
            }
        };

        return role;
    } catch(error) {
        return Promise.reject(error.message);
    };
};

/**
 * Returns an array of users and roles within a group.
 * @param {Number} groupId 
 */
async function updateGroupCache(groupId) {
    const x = await Roblox.http("https://groups.roblox.com/v1/groups/3413904/users?sortOrder=Asc&limit=100", undefined, true);
    console.log(x);
};

/**
 * Returns an array of roles the user has received / removed and the nickname that has been changed.
 * @param {GuildMember} Member the member to get the roles for.
 * @param {Guild} guild the guild to get the roles from.
 * @param {number} robloxId the roblox id of the user.
 * @param {number} groupId the group id of the group.
 * @returns {Promise<Array>}
 */
async function getGroupRoles(Member, guild, robloxId, groupId) {
    if (!(Member instanceof GuildMember) || !(guild instanceof Guild))
        return false, "Inproper use of function.";
    
    const Settings = getSettings();
    const added = [];
    const removed = [];
    let errorMessage = null;
    let nicknameChange = "Couldn't load in time.|false";
    let groupData = null;
    let userData = null;

    try {
        groupData = (await Roblox.getGroups(robloxId)).filter(g => g.Id === 3413904);
        userData = await Roblox.getPlayerInfo(robloxId);
    } catch(error) {
        console.error(error);
        return {
            success: false,
            data: "Unable to do that at this time."
        };
    };

    if (groupData != null && groupData.length > 0) {
        try {
            Member = await guild.members.fetch(Member.id);
            groupData = groupData[0];

            const groupRoles = await Roblox.getRoles(groupId);
            const currentRoles = Member.roles.cache;
            const newGroupRole = await getRoleByName(guild, groupData.Role);

            // Add new role to discord user.
            if (!Member.roles.cache.get(newGroupRole.id)) {
                await Member.roles.add(newGroupRole);
                added.push(newGroupRole.name);
            };

            // Check for if user already has roles and remove them.
            if (groupData != null) {
                currentRoles.forEach(async (ROLE) => {
                    for (let i = 0; i < groupRoles.length; i++) {
                        if (String(ROLE.name).toLowerCase() === String(groupData.Role).toLowerCase()) continue;
                        if (String(ROLE.name).toLowerCase() === String(groupRoles[i].name).toLowerCase()) {
                            await Member.roles.remove(ROLE);
                            removed.push(ROLE.name);
                        };
                    };
                });
            };
            
            // Check if user does not have their roblox username set as their discord nickname.
            if (Member.nickname != userData.username) {
                try {
                    const currentNickname = (Member.nickname != null) ? Member.nickname : Member.user.username;
                    await Member.setNickname(userData.username);
                    nicknameChange = `${currentNickname}|${userData.username}|true`;
                } catch(error) {
                    nicknameChange = "Since you're the server owner, I couldn't set your nickname to your Roblox username.|false";
                };
            };
        } catch(error) {
            errorMessage = (error.message === "Missing Permissions") ? "Missing permissions to add roles, please make sure my role is higher than everyone else's!" : error.message;
        };
    };
    
    try {
        const verifiedRole = await getRoleByName(guild, "Verified");
        if (Member.roles.cache.get(verifiedRole.id) == null) {
            await Member.roles.add(verifiedRole);
            added.push("Verified");
        };
    } catch(error) {
        errorMessage = (error.message === "Missing Permissions") ? "Missing permissions to add roles, please make sure my role is higher than everyone else's!" : error.message;
    };

    return {
        success: (errorMessage == null),
        data: (errorMessage == null) ? [added, removed, nicknameChange] : errorMessage
    };
}

module.exports = getGroupRoles;