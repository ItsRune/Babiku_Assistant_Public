function calculateTime(seconds) {
    let output = "";
    seconds = Math.floor(seconds);

    while (seconds > 0) {
        if (seconds >= 86400) {
        output += `${Math.floor(seconds / 86400)}d`;
        seconds -= Math.floor(seconds / 86400) * 86400;
        } else if (seconds >= 3600) {
        output += ` ${Math.floor(seconds / 3600)}h`;
        seconds -= Math.floor(seconds / 3600) * 3600;
        } else if (seconds >= 60) {
        output += ` ${Math.floor(seconds / 60)}m`;
        seconds -= Math.floor(seconds / 60) * 60;
        } else if (seconds > 0) {
        output += ` ${seconds}s`;
        seconds -= seconds;
        };
    };

    return output;
};

module.exports = calculateTime;