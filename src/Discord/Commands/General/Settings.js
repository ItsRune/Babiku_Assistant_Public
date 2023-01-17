const path = require('path');
const fs = require('fs')
const CommandFormat = require('../../../Utils/Formats/CommandFormat');
const CreateEmbed = require('../../../Utils/Functions/CreateEmbed');
const pathToSettings = path.join(__dirname, '../../../../Settings.json');

class Command extends CommandFormat {
    constructor() {
        super('settings', 'Display the settings for this bot.', ['options'], '', false, false, [
            "clientid:352604785364697091"
        ]);
    };

    /**
     * Takes the new value and converts it to the old one.
     * @param {any} oldValue 
     * @param {any} newValue 
     * @returns any
     */
    convertNewValueToOld(oldValue, newValue) {
        if (typeof (oldValue) === "boolean") {
            if (String(newValue).toLowerCase() === "true" || String(newValue).toLowerCase() === "false") {
                return (String(newValue).toLowerCase() === "true") ? true : false;
            } else if (Number(newValue) != NaN) {
                return (Number(newValue) === 1) ? true : false;
            };
        } else if (typeof (oldValue) === "number") {
            return (Number(newValue));
        } else {
            const val = String(newValue);

            if (val.startsWith("<#") && val.endsWith(">")) {
                return val.slice(2, -1);
            };

            return val;
        }
    };

    /**
     * Converts the setting to a mention.
     * @param {any} settingValue 
     * @param {string} settingParentName 
     * @returns string
     */
    convertSettingToMention(settingValue, settingParentName) {
        let value = /[0-9]+/g.exec(settingValue);
        if (!value) return settingValue;
        value = value[0];

        if (settingParentName.toLowerCase().indexOf('channel') != -1) {
            return `<#${value}>`;
        } else if (settingParentName.toLowerCase().indexOf('role') != -1) {
            return `<@&${value}>`;
        };

        return settingValue;
    };

    /**
     * Takes a mentioned role / channel and converts it's id to a string.
     * @param {Object} mention 
     * @param {string} settingParentName 
     * @returns string
     */
    convertMentionToSetting(mention, settingParentName) {
        let value;
        if (settingParentName.toLowerCase().indexOf('channel') != -1) {
            value = mention.match(/[0-9]/g)[0];
        } else if (settingParentName.toLowerCase().indexOf('role') != -1) {
            value = mention.match(/[0-9]/g)[0];
        };
        return value;
    };

    /**
     * Spaces out strings that are capitalized: "HelloWorld" => "Hello World"
     * @param {string} string 
     * @returns string
     */
    spaceOutWords(string) {
        return string.replace(/([A-Z])/g, ' $1').trim();
    };

    /**
     * Formats the settings for readability.
     * @param {Object} Client 
     * @param {Object} current 
     * @returns 
     */
    formatSettings(Client, current) {
        let formatted = "";

        for (const key in current) {
            if (typeof (current[key]) === "object") {
                let name, value;
                formatted = `${formatted}\n\n**__${this.spaceOutWords(key)}__**`
                for (const commandSettingName in current[key]) {
                    if (typeof (current[key][commandSettingName]) === "object") {
                        name = `${commandSettingName}\n`
                        let values = [];
                        for (const [i, v] of Object.entries(current[key][commandSettingName])) {
                            values.push(`○ ${i} -> ${this.convertSettingToMention(v, key)}`);
                        };
                        value = values.join("\n");
                    } else {
                        let val = (String(current[key][commandSettingName]) === "") ? "None" : this.convertSettingToMention(current[key][commandSettingName], key);
                        name = ``
                        value = `○ ${commandSettingName} -> ${val}`
                    };
                    formatted = `${formatted}\n${name}${value}`;
                };
            } else {
                formatted = `${formatted}\n${key} => \`${current[key]}\``;
            };
        };
        formatted = `**__General__**${formatted}\n\nTo change a general setting, please type:\n\`${Client.Prefix}${this.name} change <Setting Name> = <New Value>\`\nTo change other settings, this system uses breadcrumbs to make it possible. So, for example, if you want to change the shift announcement channel, please type:\n\`${Client.Prefix}${this.name} change announcementchannels.Shift = <New Channel>\``;

        return formatted;
    };

    /**
     * Takes the settings and changes the keys to lowercase.
     * @param {Object} current 
     * @returns {Object} formatted
     */
    convertSettingKeysToLower(current) {
        let formatted = {};

        for (const [key, value] of Object.entries(current)) {
            if (typeof (value) === "object") {
                formatted[String(key).toLowerCase()] = [key, this.convertSettingKeysToLower(value)];
            } else {
                formatted[String(key).toLowerCase()] = [key, value];
            }
        };

        return formatted;
    }

    async run(Client, Message, Args) {
        const upperArgs = Message.content.split(" ");

        let beforeSettings = require(pathToSettings)
        let currentSettings = beforeSettings.Options;

        if (!Args[0]) {
            const formatted = this.formatSettings(Client, currentSettings);
            CreateEmbed(Message, `${currentSettings.embedHeader} | Settings`, formatted);
        } else {
            switch (Args[0]) {
                case 'display':
                    return this.run(Client, Message, []);
                break;
                case 'change':
                    // Do pathing logic for example: "groupranks.shr = 1" OR "prefix = !"
                    const pathToSetting = Args[1].split(".");

                    let generalIndex = pathToSetting.indexOf('general');
                    if (generalIndex != -1) {
                        pathToSetting.splice(generalIndex, 1).splice(generalIndex + 1, 1);
                    };

                    let mentionRequired = false;
                    let pointerValue;
                    let breadcrumb = "currentSettings";
                    for (let i = 0; i < pathToSetting.length; i++) {
                        if (!pointerValue || (typeof(pointerValue) !== "object" && !Array.isArray(pointerValue))) {
                            for (const [key, value] of Object.entries(currentSettings)) {
                                if (key.toLowerCase() === pathToSetting[0].toLowerCase()) {
                                    mentionRequired = ((key.toLowerCase().indexOf("channel") != -1 || key.toLowerCase().indexOf("role") != -1) && mentionRequired == false) ? true : false;
                                    breadcrumb += `.${key}`;
                                    pointerValue = value;
                                    break;
                                };
                            };
                        } else {
                            for (const [key, value] of Object.entries(pointerValue)) {
                                if (key.toLowerCase() === pathToSetting[i].toLowerCase()) {
                                    mentionRequired = ((key.toLowerCase().indexOf("channel") != -1 || key.toLowerCase().indexOf("role") != -1) && mentionRequired == false) ? true : false;
                                    breadcrumb += `.${key}`;
                                    pointerValue = value;
                                    break;
                                };
                            };
                        };
                    };

                    const currentValue = eval(breadcrumb.split(" ")[0]);
                    const updatedValue = (Message.content.includes("=")) ? (Message.content.split("=")[1]).replace(" ", "") : Args[Args.length - 1];
                    const newValue = this.convertNewValueToOld(currentValue, String(updatedValue));
                    const formatted = this.convertSettingToMention(newValue, pathToSetting[0]);

                    if (!newValue || !formatted) return CreateEmbed(Message, `${Settings.Options.embedHeader} | Settings`, `Invalid value.`);
                    
                    eval(`${breadcrumb} = ${(typeof(newValue) == "string") ? `"${newValue}"` : newValue}`);
                    fs.writeFileSync(pathToSettings, JSON.stringify(beforeSettings, null, 4));
                    
                    Client.updateSettings();
                    CreateEmbed(Message, `${beforeSettings.Options.embedHeader} | Settings`, `Successfully changed \`${breadcrumb.split(".").splice(1, 1).join(".")}\` to ${formatted}`);
                break;
            };
        }
    };
};

module.exports = Command;