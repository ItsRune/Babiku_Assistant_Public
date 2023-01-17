const fs = require('fs');
const path = require('path');
const CommandsFormat = require('../Formats/CommandFormat');

async function addCommands(Client, dir, recurssive=false, dirName="Misc") {
  const dirPath = (recurssive == false) ? path.join(__dirname, dir) : dir;

  fs.readdir(dirPath, (err, files) => {
    if (err) return;

    for (let i = 0; i < files.length; i++) {
      const fileName = files[i];
      const filePath = path.join(dirPath, fileName);

      fs.lstat(filePath, (err, stats) => {
        if (err) return;

        if (stats.isDirectory()) return addCommands(Client, filePath, true, fileName);
        if (fileName.endsWith('.js')) {
          const fileContents = require(filePath);
          if (fileContents.prototype instanceof CommandsFormat) {
            const newCommand = new fileContents();

            Client.Commands.set(String(newCommand.name).toLowerCase(), newCommand);
            
            newCommand.category = dirName;
            newCommand.alias.forEach((alias) => {
              Client.Commands.set(String(alias).toLowerCase(), newCommand);
            });
          };
        };
      });
    };
  });
};

module.exports = addCommands;