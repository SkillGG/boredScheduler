import { NO_DEADLINE } from "./strings";

export type DayOfTheWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

type Deadline = {
  text: string,
  date: Date
}

export function getDayOfWeekAfterWeeks(date: Date, dayOfWeek: DayOfTheWeek, weekSkip: number): Date {
  if (!(date instanceof Date)) date = new Date();
  let resultDate = new Date(date.getTime());
  resultDate.setDate(resultDate.getDate() + 7 * weekSkip);
  return getNextDayOfWeek(resultDate, dayOfWeek);
}

export function getNextDayOfWeek(date: Date, dayOfWeek: DayOfTheWeek): Date {
  if (!(date instanceof Date)) date = new Date();
  let resultDate = new Date(date.getTime());
  resultDate.setDate(resultDate.getDate() + (7 + dayOfWeek - resultDate.getDay()) % 7);
  return resultDate;
}

export let getUTCDate = (date: Date, year?: boolean): string => {
  if (!(date instanceof Date)) return "";
  return `${date.getUTCDate() < 10 ? `0${date.getUTCDate()}` : date.getUTCDate()}/${(date.getUTCMonth() + 1) < 10 ? `0${date.getUTCMonth() + 1}` : date.getUTCMonth() + 1}${year ? `/${date.getUTCFullYear()}` : ""} UTC`;
}

export let getNextDayWithDate = (dayOfTheWeek: DayOfTheWeek | null, date: Date, weekSkip?: number): string => {
  if (!weekSkip) {
    switch (dayOfTheWeek) {
      case 0:
      case 7: return "Sunday " + getUTCDate(getNextDayOfWeek(date, dayOfTheWeek));
      case 1: return "Monday " + getUTCDate(getNextDayOfWeek(date, dayOfTheWeek));
      case 2: return "Tuesday " + getUTCDate(getNextDayOfWeek(date, dayOfTheWeek));
      case 3: return "Wednsday " + getUTCDate(getNextDayOfWeek(date, dayOfTheWeek));
      case 4: return "Thursday " + getUTCDate(getNextDayOfWeek(date, dayOfTheWeek));
      case 5: return "Friday " + getUTCDate(getNextDayOfWeek(date, dayOfTheWeek));
      case 6: return "Saturday " + getUTCDate(getNextDayOfWeek(date, dayOfTheWeek));
      default: return NO_DEADLINE;
    }
  }
  switch (dayOfTheWeek) {
    case 0:
    case 7: return "Sunday " + getUTCDate(getDayOfWeekAfterWeeks(date, dayOfTheWeek, weekSkip));
    case 1: return "Monday " + getUTCDate(getDayOfWeekAfterWeeks(date, dayOfTheWeek, weekSkip));
    case 2: return "Tuesday " + getUTCDate(getDayOfWeekAfterWeeks(date, dayOfTheWeek, weekSkip));
    case 3: return "Wednsday " + getUTCDate(getDayOfWeekAfterWeeks(date, dayOfTheWeek, weekSkip));
    case 4: return "Thursday " + getUTCDate(getDayOfWeekAfterWeeks(date, dayOfTheWeek, weekSkip));
    case 5: return "Friday " + getUTCDate(getDayOfWeekAfterWeeks(date, dayOfTheWeek, weekSkip));
    case 6: return "Saturday " + getUTCDate(getDayOfWeekAfterWeeks(date, dayOfTheWeek, weekSkip));
    default: return NO_DEADLINE;
  }
}

export let getDeadline = (dayOfWeek: DayOfTheWeek, date: Date, weekSkip?: number): Deadline => {
  return {
    text: date.getTime() > 0 ? getNextDayWithDate(dayOfWeek, date, weekSkip) : NO_DEADLINE,
    date: date.getTime() > 0 ? (weekSkip ? getDayOfWeekAfterWeeks(date, dayOfWeek, weekSkip) : getNextDayOfWeek(date, dayOfWeek)) : null
  };
}

export default {}