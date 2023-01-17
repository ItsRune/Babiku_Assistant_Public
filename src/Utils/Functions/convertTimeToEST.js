const Moment = require('moment-timezone');

const standardTimes = {
    "est": "America/New_York",
    "cst": "America/Chicago",
    "mst": "America/Denver",
    "pst": "America/Los_Angeles",
    "akst": "America/Anchorage",
    "hst": "Pacific/Honolulu",
    "utc": "Etc/UTC",
    "gmt": "Etc/GMT",
    "cet": "Europe/Berlin",
    "eet": "Europe/Helsinki",
    "msk": "Europe/Moscow",
    "jst": "Asia/Tokyo",
    "aest": "Australia/Sydney",
    "nzst": "Pacific/Auckland"
}

const timeRegex = /(\d){2}\:(\d){2}|(\d)\:(\d){2}/m;
const splitterRegex = /(\/|\-|\\)/m;
const dateRegex = /(((\d){2}(\/|\-|\\)(\d){2}(\/|\-|\\))|((\d){1}(\/|\-|\\)(\d){1}(\/|\-|\\))|((\d){1}(\/|\-|\\)(\d){2}(\/|\-|\\))|((\d){2}(\/|\-|\\)(\d){1}(\/|\-|\\)))((\d){4}|(\d){2})/m;

function convertTimeToEST(Args, minuteLimit) {
    let toConvertFrom = "America/New_York";
    let indexOfArea = Args.length;

    for (const i in Args) {
        if (Object.keys(standardTimes).indexOf(String(Args[i]).toLowerCase()) !== -1) {
            toConvertFrom = standardTimes[String(Args[i]).toLowerCase()];
            indexOfArea = i;
            break;
        };
    };
    
    // Create a new timezone with hours and minutes as the given time.
    let Time = Moment().tz(toConvertFrom)
    let timeIndex = null;
    let type = null;

    for (const i in Args) {
        if (String(Args[i]).toLowerCase() == "am" || String(Args[i]).toLowerCase() == "pm") {
            type = String(Args[i]).toLowerCase();
            timeIndex = (i === 0) ? 0 : i - 1;
            break;
        };
    };

    // Get the date index.
    let dateIndex = null;
    for (const i in Args) {
        if (dateRegex.test(String(Args[i]))) {
            dateIndex = i;
            break;
        };
    };

    if (timeIndex == null) {
        timeIndex = indexOfArea - 1;
    };

    if (!Args[timeIndex]) {
        let nowHour = Time.hours();
        const minutes = Time.minutes();
        const amOrPm = (nowHour > 12) ? "pm" : "am";
        const hours = (nowHour > 12) ? nowHour - 12 : nowHour;

        Args[timeIndex] = hours + ":" + minutes;
        Args[timeIndex + 1] = amOrPm;
    };

    let days = null;
    let currentDays = null;
    if (dateIndex !== null) {
        const splitter = splitterRegex.exec(String(Args[dateIndex]))[0];

        const date = String(Args[dateIndex]).split(splitter);
        const month = Number(date[0]);
        const year = Number(date[2]);
        
        currentDays = Number(Time.format("DD"));
        days = Number(date[1]);

        // if (days < Number(currentDays)) {
        //     days += (currentDays % days);
        // }

        const dateString = `${(String(year).length == 2) ? "20" + year : year}-${(month < 10) ? "0" + month : month}-${(days < 10) ? "0" + days : days}T${Time.hours() < 10 ? "0" + Time.hours() : Time.hours()}:${Time.minutes() < 10 ? "0" + Time.minutes() : Time.minutes()}`;
        Time = Moment(dateString).tz(toConvertFrom);
    };
    
    let hours;
    let minutes;
    if (Args[timeIndex].indexOf(':') !== -1 && timeRegex.test(Args[timeIndex])) {
        const localTime = timeRegex.exec(Args[timeIndex]);

        if (localTime !== null) {
            hours = Number(localTime[0].split(':')[0]);
            minutes = Number(localTime[0].split(':')[1]);
        };
    } else {
        hours = Number(Args[0]);
        minutes = 0;
    };

    if (type != null) {
        hours = (type == "pm") ? ((hours < 12) ? hours + 12 : hours) : ((hours > 12) ? hours - 12 : hours);
    };

    let shiftType = "Restaurant";
    if (Args[Args.length - 1] != null) {
        const matched = String(Args[Args.length - 1]).toLowerCase().match("train");

        if (matched != null) {
            shiftType = "Training";
        };
    };

    // If hours is greater than the current hour, then set the time to the next day.
    if (Time.hours() > hours && currentDays >= (days || 0)) {
        Time.add(1, 'day');
    };

    // If minutes does not end with a 0 or 30 then make it
    if (minuteLimit && minutes % 30 != 0) {
        minutes = (minutes - (minutes % 30)) + 30;
    };

    // Check for if current time is set to the specified time, otherwise make it.
    if (Time.hours() != hours || Time.minutes() != minutes) {
        Time.hours(hours);
        Time.minutes(minutes);
    };

    // Convert Time to EST
    const TimeEST = Time.tz("America/New_York");
    const TimeString = TimeEST.format('MMMM DD YYYY h:mm A');
    const TimeUnix = TimeEST.unix();

    return {
        TimeEST,
        TimeString,
        TimeUnix
    }
}

module.exports = {
    convertTimeToEST,
    standardTimes
};