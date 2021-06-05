"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strings_1 = require("./strings");
function getDayOfWeekAfterWeeks(date, dayOfWeek, weekSkip) {
    if (!(date instanceof Date))
        date = new Date();
    let resultDate = new Date(date.getTime());
    resultDate.setDate(resultDate.getDate() + 7 * weekSkip);
    return getNextDayOfWeek(resultDate, dayOfWeek);
}
exports.getDayOfWeekAfterWeeks = getDayOfWeekAfterWeeks;
function getNextDayOfWeek(date, dayOfWeek) {
    if (!(date instanceof Date))
        date = new Date();
    let resultDate = new Date(date.getTime());
    resultDate.setDate(resultDate.getDate() + (7 + dayOfWeek - resultDate.getDay()) % 7);
    return resultDate;
}
exports.getNextDayOfWeek = getNextDayOfWeek;
exports.getUTCDate = (date, year) => {
    if (!(date instanceof Date))
        return "";
    return `${date.getUTCDate() < 10 ? `0${date.getUTCDate()}` : date.getUTCDate()}/${(date.getUTCMonth() + 1) < 10 ? `0${date.getUTCMonth() + 1}` : date.getUTCMonth() + 1}${year ? `/${date.getUTCFullYear()}` : ""} UTC`;
};
exports.getNextDayWithDate = (dayOfTheWeek, date, weekSkip) => {
    if (!weekSkip) {
        switch (dayOfTheWeek) {
            case 0:
            case 7: return "Sunday " + exports.getUTCDate(getNextDayOfWeek(date, dayOfTheWeek));
            case 1: return "Monday " + exports.getUTCDate(getNextDayOfWeek(date, dayOfTheWeek));
            case 2: return "Tuesday " + exports.getUTCDate(getNextDayOfWeek(date, dayOfTheWeek));
            case 3: return "Wednsday " + exports.getUTCDate(getNextDayOfWeek(date, dayOfTheWeek));
            case 4: return "Thursday " + exports.getUTCDate(getNextDayOfWeek(date, dayOfTheWeek));
            case 5: return "Friday " + exports.getUTCDate(getNextDayOfWeek(date, dayOfTheWeek));
            case 6: return "Saturday " + exports.getUTCDate(getNextDayOfWeek(date, dayOfTheWeek));
            default: return strings_1.NO_DEADLINE;
        }
    }
    switch (dayOfTheWeek) {
        case 0:
        case 7: return "Sunday " + exports.getUTCDate(getDayOfWeekAfterWeeks(date, dayOfTheWeek, weekSkip));
        case 1: return "Monday " + exports.getUTCDate(getDayOfWeekAfterWeeks(date, dayOfTheWeek, weekSkip));
        case 2: return "Tuesday " + exports.getUTCDate(getDayOfWeekAfterWeeks(date, dayOfTheWeek, weekSkip));
        case 3: return "Wednsday " + exports.getUTCDate(getDayOfWeekAfterWeeks(date, dayOfTheWeek, weekSkip));
        case 4: return "Thursday " + exports.getUTCDate(getDayOfWeekAfterWeeks(date, dayOfTheWeek, weekSkip));
        case 5: return "Friday " + exports.getUTCDate(getDayOfWeekAfterWeeks(date, dayOfTheWeek, weekSkip));
        case 6: return "Saturday " + exports.getUTCDate(getDayOfWeekAfterWeeks(date, dayOfTheWeek, weekSkip));
        default: return strings_1.NO_DEADLINE;
    }
};
exports.getDeadline = (dayOfWeek, date, weekSkip) => {
    if (!date)
        return { text: strings_1.NO_DEADLINE, date: null };
    return {
        text: date.getTime() > 0 ? exports.getNextDayWithDate(dayOfWeek, date, weekSkip) : strings_1.NO_DEADLINE,
        date: date.getTime() > 0 ? (weekSkip ? getDayOfWeekAfterWeeks(date, dayOfWeek, weekSkip) : getNextDayOfWeek(date, dayOfWeek)) : null
    };
};
exports.default = {};
//# sourceMappingURL=datefn.js.map