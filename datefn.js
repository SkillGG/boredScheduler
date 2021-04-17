function getDayOfWeekAfterWeeks(date = new Date(), dayOfWeek = 0, weeks = 1){
  weeks = parseInt(weeks)||1;
  if(!(date instanceof Date)) date = new Date();
  let resultDate = new Date(date.getTime());
 resultDate.setDate(resultDate.getDate() + 7*weeks);
  return getNextDayOfWeek(resultDate, dayOfWeek);
}

function getNextDayOfWeek(date = new Date(), dayOfWeek = 0) {
    dayOfWeek = (parseInt(dayOfWeek)||1)%7;
    if(!(date instanceof Date)) date = new Date();
    let resultDate = new Date(date.getTime());
    resultDate.setDate(resultDate.getDate() + (7 + dayOfWeek - resultDate.getDay()) % 7);
     return resultDate;
}

let gdt = (date = new Date(), year = !0)=>{
  if(!(date instanceof Date)) return "";
  return `${date.getUTCDate()<10?`0${date.getUTCDate()}`:date.getUTCDate()}/${(date.getUTCMonth()+1)<10?`0${date.getUTCMonth()+1}`:date.getUTCMonth()+1}${year?`/${date.getUTCFullYear()}`:""} UTC`;
}

const NO_DEADLINE = "none";

let dow = (e = 0,ws = 0,date = new Date())=>{
  if(!ws){
    switch(e){
      case 0:
      case 7: return "Sunday "  +`${gdt(getNextDayOfWeek(date,e))}`;
      case 1: return "Monday "  +`${gdt(getNextDayOfWeek(date,e))}`;
      case 2: return "Tuesday " +`${gdt(getNextDayOfWeek(date,e))}`;
      case 3: return "Wednsday "+`${gdt(getNextDayOfWeek(date,e))}`;
      case 4: return "Thursday "+`${gdt(getNextDayOfWeek(date,e))}`;
      case 5: return "Friday "  +`${gdt(getNextDayOfWeek(date,e))}`;
      case 6: return "Saturday "+`${gdt(getNextDayOfWeek(date,e))}`;
      default: return NO_DEADLINE;
    }
  }else {
    switch(e){
      case 0:
      case 7: return "Sunday "  +`${gdt(getDayOfWeekAfterWeeks(date,e,ws))}`;
      case 1: return "Monday "  +`${gdt(getDayOfWeekAfterWeeks(date,e,ws))}`;
      case 2: return "Tuesday " +`${gdt(getDayOfWeekAfterWeeks(date,e,ws))}`;
      case 3: return "Wednsday "+`${gdt(getDayOfWeekAfterWeeks(date,e,ws))}`;
      case 4: return "Thursday "+`${gdt(getDayOfWeekAfterWeeks(date,e,ws))}`;
      case 5: return "Friday "  +`${gdt(getDayOfWeekAfterWeeks(date,e,ws))}`;
      case 6: return "Saturday "+`${gdt(getDayOfWeekAfterWeeks(date,e,ws))}`;
      default: return NO_DEADLINE;
    }
  }
}

let getDeadline = (e = 0,ws = 0,date = new Date())=>{
  return {text: date>0?dow(e,ws,date):NO_DEADLINE, date:date>0?(ws?getDayOfWeekAfterWeeks(date,e,ws):getNextDayOfWeek(date,e)):-1};
}

module.exports.getNextDayOfWeek = getNextDayOfWeek;
module.exports.getDayOfWeekAfterWeeks = getDayOfWeekAfterWeeks;
module.exports.getDeadline = getDeadline;
module.exports.gdt = gdt;
module.exports.dow = dow;
module.exports.NO_DEADLINE = NO_DEADLINE;

