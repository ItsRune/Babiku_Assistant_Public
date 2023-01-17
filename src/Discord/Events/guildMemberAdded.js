const EventFormat = require('../../Utils/Formats/EventFormat');
const tryExistingVerification = require('../../Utils/Functions/tryExistingVerification')

class Event extends EventFormat {
  constructor() {
    super('guildMemberAdd');
  };

  async run(Client, Member) {
    try {
        await tryExistingVerification(Member, Member.guild);
    } catch(error) {
        console.error(error);
    }
  };
};

module.exports = Event;