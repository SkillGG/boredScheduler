import { BreakableStatus, CLRDTSStatus, isBreakableStatus, isCubariRelease, isDexRelease, ReleaseStatus, SData, Series } from "./series";
import { isStringURL, RGX } from "./regexs";

import Discord = require("discord.js");
import { Channels, discordClient } from "./DiscordIDs";

import { show } from "./show";
import { CubariChapterLink, defaultStatusCodes, DexChapterLink } from "./strings";

const NOMENTION: boolean = true;

type MessageDoChange = {
  statusType: string,
  newStatus: number | CLRDTSStatus | ReleaseStatus,
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

export let ondone = async (SeriesData: SData, msg: Discord.Message, msgresult: string): Promise<ReturnOnMessage> => {
  // done *
  let doneresult: RegExpExecArray;
  if (doneresult = RGX.done.exec(msgresult.trim())) {
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
          let sCodes = _selectS.statusCodes || defaultStatusCodes;
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
              case "QC":
                {
                  donechange = [{ statusType: sT, newStatus: 1, foundIndex: i }];
                }
                break;
              case "CL":
              case "RD":
              case "TS":
                {
                  let newStatus: BreakableStatus;
                  if (rest) {
                    if (/partial/i.exec(rest)) {
                      if (!newStatus || typeof newStatus !== "object")
                        newStatus = { partial: !0, almost: !1 };
                      else
                        newStatus.partial = !(newStatus.almost = !1);
                    } else if (/almost/i.exec(rest)) {
                      if (!(!!newStatus && typeof newStatus === "object"))
                        newStatus = { partial: !1, almost: !0 };
                      else
                        newStatus.partial = !(newStatus.almost = !0);
                    }
                  }
                  donechange = [{ newStatus: newStatus || 1, statusType: sT, foundIndex: i }];
                }
                break;
              case "CLRD":
                {
                  let newStatus: CLRDTSStatus;
                  if (rest) {
                    if (/partial/i.exec(rest)) {
                      if (!(!!newStatus && typeof newStatus === "object"))
                        newStatus = { partial: !0, almost: !1 };
                      else
                        newStatus.partial = !(newStatus.almost = !1);
                    } else if (/almost/i.exec(rest)) {
                      if (!(!!newStatus && typeof newStatus === "object"))
                        newStatus = { partial: !1, almost: !0 };
                      else
                        newStatus.partial = !(newStatus.almost = !0);
                    }
                  }
                  let i_c = _selectS.getIndexOfStatus("CL");
                  i_c = i_c === 0 ? i_c : (i_c || -1);
                  let i_r = _selectS.getIndexOfStatus("RD");
                  i_r = i_r === 0 ? i_r : (i_r || -1);
                  donechange = [{ statusType: "CL", foundIndex: i_c, newStatus: newStatus },
                  { statusType: "RD", foundIndex: i_r, newStatus: newStatus || 1 }];
                }
                break;
              case "RL":
                {
                  let e: ReleaseStatus = null;
                  if (!rest)
                    return show.error({ msg: "Site Not specified!", command: "done \\* **RL**" }, msg.channel);
                  // TODO: LATE and WEEKSKIP implemetation 
                  rest = rest.trim();
                  let restRX: RegExpExecArray;
                  if (restRX = RGX.ReleaseRest.exec(rest)) {
                    if (restRX.groups.dexid) {
                      e = { msgID: null, dexid: restRX.groups.dexid };
                    }
                    if (restRX.groups.cubari) {
                      e = { msgID: null, cubari: restRX.groups.cubari }
                    }
                    if (restRX.groups.link && restRX.groups.lname) {
                      if (isStringURL(restRX.groups.link)) {
                        e = { msgID: null, link: restRX.groups.link, name: restRX.groups.lname }
                      }
                    }
                    let releaseLink = (): string => {
                      if (isDexRelease(e))
                        return `On MangaDex: ${DexChapterLink}${e.dexid}`
                      if (isCubariRelease(e)) return `On Cubari: ${CubariChapterLink}${e.cubari}`
                      return `On ${e.name}: ${e.link}`
                    }
                    let RelMSG = await discordClient.channels.fetch(Channels.release).then(async chn => {
                      return await (chn as Discord.TextChannel)
                        .send(`${NOMENTION ? "" : _selectS.getMention()}**${_selectS.getName()} chapter ${selectC.id} released**\n${releaseLink()}`);
                    });
                    e.msgID = RelMSG.id;
                    donechange = [{ statusType: sT, foundIndex: i, newStatus: e }];
                    let nc = _selectS.chapters[_selectS.chapters.indexOf(selectC) + 1]
                    if (!nc) {
                      _selectS.finished = true;
                      break;
                    }
                    _selectS.current = nc.id;
                    selectC.sDate = selectC.startDate;
                    selectC.startDate = null;
                    nc.startDate = getNewDate();
                  } else {
                    show.error(
                      {
                        msg: `Incorrect site data!! Check \`done help\` for more info!`,
                        command: `${msg.content.replace(/([\*~_`])/g, "\\$1")}`,
                        timeout: 5000
                      }, msg.channel);
                  }
                }
                break;
            }
            if (donechange) {
              let changed = false;
              donechange.forEach(dC => {
                if (dC.foundIndex >= 0) {
                  changed = true;
                  if (!dummy)
                    selectC.status[dC.foundIndex] = dC.newStatus;
                }
              });
              if (changed) {
                await SeriesData.save();
                // console.log(show);
                await show.last(msg.channel, { data: SeriesData.data, sdata: _selectS, chdata: selectC });
                let changesInfo = (e: CLRDTSStatus | ReleaseStatus): string => {
                  if (!e && typeof e === "object") {
                    if (isBreakableStatus(e))
                      return `${e.partial ? "partial" : ""}${e.almost ? "almost" : ""}`
                    if (isDexRelease(e))
                      return `DexID: ${e.dexid}`;
                    if (isCubariRelease(e))
                      return `Cubari: ${e.cubari}`;
                    return `Link ${e.name}: ${e.link}`;
                  }
                  return "";
                }
                msg.channel.send(new Discord.MessageEmbed()
                  .setTitle(`${dummy ? "Dummy " : ""}Update ${_selectS.getName()}(#${_selectS.id})`)
                  .addField(
                    `${dummy ? "Dummy " : ""}Done`,
                    `${donechange.map((a) => `${a.statusType} ${changesInfo(a.newStatus)}`).join(",")}`
                  )
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
      return { dummy: true };
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

export let onrevoke = async (SeriesData: SData, msg: Discord.Message, msgresult: string): Promise<ReturnOnMessage> => {
  // revoke *
  let revokeresult: RegExpExecArray;
  if (revokeresult = RGX.done.exec(msgresult.trim())) {
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
          let selectC = sC ? _selectS.chapters.get(sC) : _selectS.chapters.getCurrent();
          if (!selectC) {
            // ERROR: Could not find chapter
            show.error({ msg: `Could not find chapter #${sC}`, command: `revoke ${_selectS.getName()}:${sC || "<current>"}` }, msg.channel);
          } else {
            // Found chapter
            let revokechange: MessageDoChange;
            let defNS = 0;
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
                revokechange = [{ statusType: sT, foundIndex: i, newStatus: defNS }];
                break;
              case "RL": {
                selectC = _selectS.chapters.getBeforeCurrent();
                let RM = "";
                if (selectC.status[6] && typeof selectC.status[6] == "object")
                  RM = selectC.status[6].msgID;
                if (RM)
                  discordClient.channels.fetch(Channels.release)
                    .then(c => {
                      (c as Discord.TextChannel).messages.fetch(RM)
                        .then(m => m.delete()).catch(console.error);
                    });
                revokechange = [{ statusType: sT, foundIndex: i, newStatus: defNS }];
                _selectS.current = selectC.id;
                selectC.startDate = selectC.sDate || getNewDate();
                break;
              }
              case "CLRD":
                let i_c = _selectS.getIndexOfStatus("CL");
                i_c = i_c === 0 ? i_c : (i_c || -1);
                let i_r = _selectS.getIndexOfStatus("CL");
                i_r = i_r === 0 ? i_r : (i_r || -1);
                revokechange = [{ statusType: "CL", foundIndex: i_c, newStatus: defNS },
                { statusType: "RD", foundIndex: i_r, newStatus: defNS }];
                break;
            }
            if (revokechange) {
              let changed = false;
              revokechange.forEach(dC => {
                if (dC.foundIndex >= 0) {
                  changed = true;
                  if (!dummy)
                    selectC.status[dC.foundIndex] = dC.newStatus;
                }
              });
              if (changed) {
                await SeriesData.save();
                await show.last(msg.channel, { data: SeriesData.data, sdata: _selectS, chdata: selectC });
                msg.channel.send(new Discord.MessageEmbed().setColor("#ff0000")
                  .setTitle(`${dummy ? "Dummy " : ""}Update ${_selectS.getName()}(#${_selectS.id})`)
                  .addField(`${dummy ? "Dummy " : ""}Revoke`, `${revokechange.map((a) => a.statusType).join(",")}`)
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
      return { dummy: true }
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
