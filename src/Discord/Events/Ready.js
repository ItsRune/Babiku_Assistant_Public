const EventFormat = require('../../Utils/Formats/EventFormat');
const slashBuilder = require('../../Utils/Functions/slashCommandBuilder');
const checkInactivityNotices = require('../../Utils/Functions/checkInactivityNotices');
const getSettings = require('../../Utils/Functions/getSettings');
const checkShifts = require('../../Utils/Functions/checkShifts');
const messageBetaTesters = require('../../Utils/Functions/messageBetaTesters');
const checkShiftAttendance = require('../../Utils/Functions/updateShiftAttendance');
const { checkCurrentWeek } = require('../../Utils/Functions/getCurrentWeek');
const getFailedSentApps = require('../../Utils/Functions/getFailedSentApps.js');

const profileGenerator = require('../../Utils/Functions/profileGenerator');

class Event extends EventFormat {
  constructor() {
    super('ready');
  };

  changeActivity(Client) {
    const Settings = getSettings();
    
    Client.user.setActivity(`Bean House V2`, { type: 'WATCHING' });
    if (Settings.Options.lockedForMainServer) {
      Client.user.setStatus('dnd');
      return;
    } else if (Settings.Options.semiLockedForMain) {
      Client.user.setStatus('idle');
      return;
    };
    Client.user.setStatus('online');
  };

  async run(Client) {
    const Settings = getSettings();
    console.log(`${Client.user.tag} is ready.\nThe prefix specified is "${Client.Prefix}"`);

    if (Settings.Debug === false) {
      setInterval(checkShiftAttendance, (1000 * 60 * 60)); // 1 hour
      setInterval(checkInactivityNotices, (1000 * 60 * 60)); // 1 hour
      setInterval(checkShifts, (1000 * 60 * 60)); // 1 hour
      setInterval(getFailedSentApps, (1000 * 60 * 30)); // 30 minutes
      setInterval(checkCurrentWeek, (1000 * 60)) // 1 minute
      setInterval(this.changeActivity.bind(this, Client), (1000 * 60)); // 1 minute
      // setInterval(updateGroupUsers, (1000 * 60 * 60) + 60000); // 1 hour and 1 minute
    };

    this.changeActivity(Client);
    checkInactivityNotices();
    checkShifts();
    messageBetaTesters();
    checkShiftAttendance();
    checkCurrentWeek();
    getFailedSentApps();

    // slashBuilder(Client.Commands);
  };
};

module.exports = Event;