const EventFormat = require('../../Utils/Formats/EventFormat');

class Event extends EventFormat {
  constructor() {
    super('debug');
  };

  async run(Client, errorMsg) {
    if (errorMsg.includes('429')) {
      process.kill(1);
    };
  };
};

module.exports = Event;