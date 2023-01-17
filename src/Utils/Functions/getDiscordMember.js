const Client = require('../../Discord/index');

async function getDiscordMember(guild, user) {
  const regex = /[\d]+/g;
  let target = null;

  try {
    const executed = regex.exec(user)[0];

    if (executed) {
      target = await guild.members.fetch(executed);
    };
  } catch(err) {
    console.error(err);
  }

  return target;
};

module.exports = getDiscordMember;