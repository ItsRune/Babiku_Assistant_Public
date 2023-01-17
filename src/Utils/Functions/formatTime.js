function formatTime(seconds) {
    console.assert(typeof seconds === 'number', 'Seconds must be a number.');
    let time = [];

    for (let i = 0; i < 10; i++) {
      if (seconds === 0) break;
      if (seconds >= 86400) {
          const days = Math.floor(seconds / 86400);
          seconds -= days * 86400;
          time.push(`${days}d`);
      } else if (seconds >= 3600) {
          const hours = Math.floor(seconds / 3600);
          seconds -= hours * 3600;
          time.push(`${hours}h`);
      } else if (seconds >= 60) {
          const minutes = Math.floor(seconds / 60);
          seconds -= minutes * 60;
          time.push(`${minutes}m`);
      } else {
          time.push(`${seconds}s`);
          seconds -= seconds;
      };
    };

    return time.join(' ');
};

module.exports = formatTime