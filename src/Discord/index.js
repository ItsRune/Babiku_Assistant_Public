const Discord = require('discord.js');
const { RateLimiter } = require('discord.js-rate-limiter');
const customPerms = require('../Utils/Functions/customPermissions');
const Settings = require('../../Settings.json');
const getSettings = require('../Utils/Functions/getSettings');

const Intents = Discord.Intents;
const Client = new Discord.Client({
  intents:[
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_BANS,
    Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    Intents.FLAGS.GUILD_INTEGRATIONS,
    Intents.FLAGS.GUILD_WEBHOOKS,
    Intents.FLAGS.GUILD_INVITES,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_MESSAGE_TYPING,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGE_TYPING,
    Intents.FLAGS.GUILD_SCHEDULED_EVENTS,
    Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS
  ],
  partials: ['CHANNEL'] // For Dm messages.
});

Client.Prefix = (Settings.Debug === true) ? Settings.debugPrefix : Settings.Options.Prefix;
Client.mainGuildId = (Settings.Debug === true) ? Settings.Debug_Guild_Id : Settings.Guild_Id;

Client.Commands = new Map();
Client.Events = new Map();
Client.hasPermission = customPerms;

Client.updateSettings = () => {
  const newSets = getSettings();
  Client.Prefix = newSets.Options.Prefix;
}

Client.CommandLimiter = new RateLimiter(3, 3000);
Client.EventLimiter = new RateLimiter(10, 15000);

module.exports = Client;