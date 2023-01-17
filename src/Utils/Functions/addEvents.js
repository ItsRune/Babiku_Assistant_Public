const fs = require('fs');
const path = require('path');
const EventFormat = require('../Formats/EventFormat');

async function addEvents(Client, dir, recurssive=false) {
  const dirPath = (recurssive == false) ? path.join(__dirname, dir) : dir;

  fs.readdir(dirPath, (err, files) => {
    if (err) return;

    for (let i = 0; i < files.length; i++) {
      const fileName = files[i];
      const filePath = path.join(dirPath, fileName);

      fs.lstat(filePath, (err, stats) => {
        if (err) return;

        if (stats.isDirectory()) return addEvents(Client, filePath, true);
        if (fileName.endsWith('.js')) {
          const fileContents = require(filePath);
          if (fileContents.prototype instanceof EventFormat) {
            const newEvent = new fileContents();

            Client.Events.set(newEvent.name, newEvent);
            Client.on(newEvent.name, newEvent.run.bind(newEvent, Client));
          };
        };
      });
    };
  });
};

module.exports = addEvents;