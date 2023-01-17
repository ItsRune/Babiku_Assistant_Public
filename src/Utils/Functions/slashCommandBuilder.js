const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const SettingsFile = require('../../../Settings.json');
const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const path = require('path');

const clientId = (SettingsFile.Debug === true) ? '989817806423998524' : '987061405779894332';
const guildIDs = require('../../Files/slashCommandGuilds.json');
const rest = new REST({ version: '9' });
const cachePath = path.join(__dirname, '../../Files/cachedSlashCommands.json');
const cachedCommands = require(cachePath);

// Regex \\
const removeBracketsRegex = /<(?![\w+]>)|(?<!<[\w+])>|\[(?<!<[\w+])|(?<!<[\w+])\]/g;

// Types \\
const argumentTypes = [
    ["name", 7],
    ["reason", 7],
    ["user", 4],
    ["role", 4],
]

// Descriptions \\
const argumentDescriptions = new Map();

argumentDescriptions.set("user", "A user ID or mention.");
argumentDescriptions.set("reason", "A reasoning for an action.");
argumentDescriptions.set("name", "A name for the --ARGUMENT--.");

// Command Types \\
const argTypes = [
    "addAttachmentOption", // 0
    "addBooleanOption", // 1
    "addChannelOption", // 2
    "addIntegerOption", // 3
    "addMentionableOption", // 4
    "addNumberOption", // 5
    "addRoleOption", // 6
    "addStringOption" // 7
]

async function slashCommandBuilder(Commands) {
    try {
        let commands = [];
        let commandNamesUsed = [];

        Commands.forEach(command => {
            if (command.slashCommand == true && commandNamesUsed.indexOf(command.name) == -1) {
                commandNamesUsed.push(command.name);
            
                const usage = String(command.usage).split(" ");
                const slashCommand = new SlashCommandBuilder();
            
                slashCommand.setName(command.name);
                slashCommand.setDescription(command.desc);
                slashCommand.setDMPermission(command.dmsAllowed);
    
                for (let i = 0; i < usage.length; i++) {
                    let argument = usage[i].toLowerCase();
                    let typeOfArg = removeBracketsRegex.exec(argument);
                    
                    if (typeOfArg != null) {
                        typeOfArg = typeOfArg[0];
                        argument = argument.replace(removeBracketsRegex, "");
                    };

                    const tempType = argument.split("/")[0];
                    const argumentType = argumentTypes.find(type => tempType.includes(type[0].toLowerCase()));
                    
                    if (argumentType) {
                        let argDesc = String(argumentDescriptions.get(argumentType[0]));
                        argDesc = argDesc.replace("--CMD_NAME--", command.name);
                        argDesc = argDesc.replace("--ARGUMENT--", argument);
                        // argDesc = argDesc.replace("--SOMETHING--")

                        slashCommand[argTypes[argumentType[1]]](opt => {
                            opt.setName(tempType);
                            // opt.setNameLocalization('en-US');
                            opt.setRequired((typeOfArg != null && typeOfArg.includes("<")) ? true : false);
                            opt.setDescription(argDesc);
                            return opt;
                        });
                        break;
                    };
                };
    
                commands.push(slashCommand);
            };
        });

        if (commandNamesUsed.length === cachedCommands.length) {
            console.log("Slash commands did not require an update.");
            return;
        };
        
        console.log('Started refreshing application (/) commands.');
        rest.setToken((SettingsFile.Debug === true) ? SettingsFile.Debug_Discord_Token : SettingsFile.Discord_Token);

        for (let i = 0; i < guildIDs.length; i++) {
            await rest.put(
                Routes.applicationGuildCommands(clientId, guildIDs[i]),
                { body: commands },
            );
        };

        await rest.put(
            Routes.applicationGuildCommands(clientId, '988905688199729182'),
            { body: commands },
        );

        fs.writeFileSync(cachePath, JSON.stringify(commandNamesUsed), 'utf8');
		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
};

module.exports = slashCommandBuilder