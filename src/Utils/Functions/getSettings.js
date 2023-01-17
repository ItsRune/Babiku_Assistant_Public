const path = require('path');
const fs = require('fs');

function getSettings() {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '../../../Settings.json'), 'utf-8'));
};

module.exports = getSettings;