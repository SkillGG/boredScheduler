import { BreakableStatus, CLRDTSStatus, ReleaseStatus, SData, Series } from "./series";
import { RGX } from "./regexs";

import Discord = require("discord.js");
import { Channels, discordClient } from "./DiscordIDs";

import { show, defSC } from "./show";

const NOMENTION: boolean = false;

type MessageDoChange = {
  statusType: string,
  element: number | CLRDTSStatus | ReleaseStatus,
  foundIndex: number
}[]

type ReturnOnMessage = {
  dummy: boolean,
  ex?: any,
  i?: number,
  series?: string
}

export let getNewDate = () => {
  let nDate = new Date();
  nDate.setMinutes(59); nDate.setSeconds(59); nDate.setHours(23);
  return nDate;
}

export let ondone = async (SeriesData: SData, msg: Discord.Message, msgresult: RegExpExecArray): Promise<ReturnOnMessage> => {
  // done *
  let doneresult: RegExpExecArray;
  if (doneresult = RGX.done.exec(msgresult[2].trim())) {
    let dummy = false;
    if (/dummy/i.exec(doneresult[5])) {
      doneresult[5] = doneresult[5].replace(/\s*dummy\s*/i, "");
      dummy = true;
    }
    if (!doneresult[1]) {
      // selectedSeries, selectedChapter, selectedType, rest
      let sS = doneresult[2], sC = doneresult[3], sT = doneresult[4], rest = doneresult[5];
      let selectS = SeriesData.data.series.getSeries(sS);
      if (!selectS) {
        show.error(
          {
            msg: `Could not find series **${sS}**`,
            command: `done **~~${sS}~~**:${sC || "<current>"} ${sT}${rest || ""}`,
            timeout: 2500
          }
          , msg.channel);
      } else {
        let _selectS: Series;
        let doneAccept = async () => {
          console.log(`${dummy ? "Dummy Done" : "Done"} for series:`, _selectS.getName(), "chapter:", sC);
          let sCodes = _selectS.statusCodes || defSC;
          let selectC = sC ? _selectS.chapters.get(sC) : _selectS.chapters.getCurrent();
          if (!selectC) {
            // ERROR: Could not find chapter
            show.error({ msg: `Could not find chapter #${sC}`, command: `done ${_selectS.getName()}:${sC || "<current>"}` }, msg.channel);
          } else {
            // Found chapter
            let donechange: MessageDoChange;
            console.log(sT.toUpperCase(), "rest:", rest);
            let i = _selectS.getIndexOfStatus(sT);
            i = i === 0 ? 0 : (i || -1);
            // TODO: change switch to regex
            switch (sT.toUpperCase().trim()) {
              case "TL":
              case "PR":
              case "TS":
              case "QC":
                {
                  let e: number;
                  donechange = [{ statusType: sT, element: e, foundIndex: i }];
                }
                break;
              case "CL":
              case "RD":
                {
                  let e: BreakableStatus;
                  if (rest) {
                    if (/partial/i.exec(rest)) {
                      if (!e || typeof e !== "object")
                        e = { partial: !0, almost: !1 };
                      else
                        e.partial = !(e.almost = !1);
                    } else if (/almost/i.exec(rest)) {
                      if (!(!!e && typeof e === "object"))
                        e = { partial: !1, almost: !0 };
                      else
                        e.partial = !(e.almost = !0);
                    }
                  }
                  donechange = [{ element: e, statusType: sT, foundIndex: i }];
                }
                break;
              case "CLRD":
                {
                  let e: CLRDTSStatus;
                  if (rest) {
                    if (/partial/i.exec(rest)) {
                      if (!(!!e && typeof e === "object"))
                        e = { partial: !0, almost: !1 };
                      else
                        e.partial = !(e.almost = !1);
                    } else if (/almost/i.exec(rest)) {
                      if (!(!!e && typeof e === "object"))
                        e = { partial: !1, almost: !0 };
                      else
                        e.partial = !(e.almost = !0);
                    }
                  }
                  let i_c = _selectS.getIndexOfStatus("CL");
                  i_c = i_c === 0 ? i_c : (i_c || -1);
                  let i_r = _selectS.getIndexOfStatus("RD");
                  i_r = i_r === 0 ? i_r : (i_r || -1);
                  donechange = [{ statusType: "CL", foundIndex: i_c, element: e },
                  { statusType: "RD", foundIndex: i_r, element: e }];
                }
                break;
              case "RL":
                {
                  let e: ReleaseStatus;
                  if (!rest)
                    return show.error({ msg: "Site Not specified!", command: "done \\* **RL**" }, msg.channel);
                  // TODO: LATE and WEEKSKIP implemetation 
                  let RelMSG = await discordClient.channels.fetch(Channels.release).then(async chn => {
                    return await (chn as Discord.TextChannel)
                      .send(`${NOMENTION ? "" : _selectS.mention ? `<@&${_selectS.mention}> ` : ""}**${_selectS.getName()} chapter ${selectC.id} released**\nOn MangaDex: https://mangadex.org/chapter/${rest.trim()}`);
                  });
                  if (!(!!e && typeof e === "object"))
                    e = { msgID: RelMSG.id, dexid: `${rest.trim()}` };
                  else {
                    e.msgID = RelMSG.id;
                    e.dexid = rest.trim();
                  }
                  donechange = [{ statusType: sT, foundIndex: i, element: e }];
                  let nc = _selectS.chapters[_selectS.chapters.indexOf(selectC) + 1]
                  _selectS.current = nc.id;
                  selectC.sDate = selectC.startDate;
                  selectC.startDate = null;
                  nc.startDate = getNewDate();
                }
                break;
            }
            if (donechange) {
              let changed = false;
              donechange.forEach(dC => {
                if (dC.foundIndex >= 0) {
                  changed = true;
                  if (!dummy)
                    selectC.status[dC.foundIndex] = dC.element;
                }
              });
              if (changed) {
                await SeriesData.save();
                // console.log(show);
                await show.last(msg.channel, { data: SeriesData.data, sdata: _selectS, chdata: selectC });
                msg.channel.send(new Discord.MessageEmbed()
                  .setTitle(`${dummy ? "Dummy " : ""}Update ${_selectS.getName()}(#${_selectS.id})`)
                  .addField(
                    `${dummy ? "Dummy " : ""}Done`,
                    `${donechange.map((a) => `${a.statusType} ${a.element ? ((a.element as BreakableStatus).partial ? "partial" : "") : ""}${a.element ? (a.element as BreakableStatus).almost ? "almost" : "" : ""}${a.element ? ((a.element as ReleaseStatus).dexid || "") : ""}`).join(",")}`)
                ).then(m => m.delete({ timeout: 2500 }));
              }
            }
          }
        }
        if (Array.isArray(selectS)) {
          // ask for which series to use
          // TODO: come back when finished show.ts
          let qEx, i = await show.reactionSeriesSelect(msg.channel, selectS).catch(x => (qEx = x, -1));
          if (i !== -1) {
            _selectS = selectS[i];
            await doneAccept();
            return { i, series: selectS.map((a) => a.getName()).join(","), dummy };
          }
          return { ex: qEx, series: selectS.map((a) => a.getName()).join(","), dummy };
        }
        _selectS = selectS;
        await doneAccept();
        if (dummy)
          return { dummy };
      }
    } else {
      // help
      show.help(msg.channel, 2);
    }
  } else {
    show.error(
      {
        msg: `This is not how you use **done** command! Check \`done help\` for more info!`,
        command: `${msg.content.replace(/([\*~_`])/g, "\\$1")}`,
        timeout: 5000
      }, msg.channel);
  }
}

export let onrevoke = async (SeriesData: SData, msg: Discord.Message, msgresult: RegExpExecArray): Promise<ReturnOnMessage> => {
  // revoke *
  let revokeresult: RegExpExecArray;
  if (revokeresult = RGX.done.exec(msgresult[2].trim())) {
    let dummy = false;
    if (/dummy/i.exec(revokeresult[5])) {
      revokeresult[5] = revokeresult[5].replace(/\s*dummy\s*/i, "");
      dummy = true;
    }
    if (!revokeresult[1]) {
      // selectedSeries, selectedChapter, selectedType, rest
      let sS = revokeresult[2], sC = revokeresult[3], sT = revokeresult[4], rest = revokeresult[5];
      let selectS = SeriesData.data.series.getSeries(sS);
      if (!selectS) {
        show.error(
          {
            msg: `Could not find series **${sS}**`,
            command: `revoke **~~${sS}~~**:${sC} ${sT}${rest}`,
            timeout: 2500
          }
          , msg.channel);
      } else {
        let _selectS: Series;
        let revokeAccept = async () => {
          console.log(`${dummy ? "Dummy revoke" : "Revoke"} for series:`, _selectS.getName(), "chapter:", sC);
          let sCodes = _selectS.statusCodes || defSC;
          let selectC = sC ? _selectS.chapters.get(sC) : _selectS.chapters.getCurrent();
          if (!selectC) {
            // ERROR: Could not find chapter
            show.error({ msg: `Could not find chapter #${sC}`, command: `revoke ${_selectS.getName()}:${sC || "<current>"}` }, msg.channel);
          } else {
            // Found chapter
            let revokechange = null;
            let e = 0;
            let i = _selectS.getIndexOfStatus(sT);
            i = i === 0 ? 0 : (i || -1);
            // TODO: change switch to regex
            switch (sT.toUpperCase()) {
              case "TL":
              case "PR":
              case "CL":
              case "RD":
              case "TS":
              case "QC":
              case "CL":
                revokechange = [{ x: sT, i, e }];
                break;
              case "RL": {
                let RM = "";
                if (typeof selectC.status[6] == "object")
                  RM = selectC.status[6].msgID;
                if (RM)
                  discordClient.channels.fetch(Channels.release)
                    .then(c => {
                      (c as Discord.TextChannel).messages.fetch(RM)
                        .then(m => m.delete()).catch(console.error);
                    });
                revokechange = [{ x: sT, i, e }];
                _selectS.current = selectC.id;
                selectC.startDate = selectC.sDate || getNewDate();
                break;
              }
              case "CLRD":
                let i_c = _selectS.getIndexOfStatus("CL");
                i_c = i_c === 0 ? i_c : (i_c || -1);
                let i_r = _selectS.getIndexOfStatus("CL");
                i_r = i_r === 0 ? i_r : (i_r || -1);
                revokechange = [{ x: "CL", i: i_c, e },
                { x: "RD", i: i_r, e }];
                break;
            }
            if (revokechange) {
              let changed = false;
              revokechange.forEach(dC => {
                if (parseInt(dC.i) >= 0) {
                  changed = true;
                  if (!dummy)
                    selectC.status[parseInt(dC.i)] = dC.e;
                }
              });
              if (changed) {
                await SeriesData.save();
                await show.last(msg.channel, { data: SeriesData.data, sdata: _selectS, chdata: selectC });
                msg.channel.send(new Discord.MessageEmbed().setColor("#ff0000")
                  .setTitle(`${dummy ? "Dummy " : ""}Update ${_selectS.getName()}(#${_selectS.id})`)
                  .addField(`${dummy ? "Dummy " : ""}Revoke`, `${revokechange.map((a, v) => v = a.x).join(",")}`)
                ).then(msg => msg.delete({ timeout: 2500 }));
              }
            }
          }
        }
        if (Array.isArray(selectS)) {
          // ask for which series to use
          // TODO: come back when finished show.ts
          let qEx, i = await show.reactionSeriesSelect(msg.channel, selectS).catch(x => (qEx = x, -1));
          if (i !== -1) {
            _selectS = selectS[i];
            await revokeAccept();
            return { i, series: selectS.map((a) => a.getName()).join(","), dummy };
          }
          return { ex: qEx, series: selectS.map((a) => a.getName()).join(","), dummy };
        }
        _selectS = selectS;
        await revokeAccept();
        if (dummy)
          return { dummy };
      }
    } else {
      // help
      show.help(msg.channel, 3);
    }
  } else {
    show.error(
      {
        msg: `This is not how you use **revoke** command! Check \`revoke help\` for more info!`,
        command: `${msg.content.replace(/([\*~_`])/g, "\\$1")}`,
        timeout: 5000
      }, msg.channel);
  }
}