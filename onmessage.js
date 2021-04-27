const Discord = require("discord.js");
const { show, newf, newfb, defSC } = require("./show.js");
const { RGX } = require("./regexs.js")

let SeriesData;

let ondone = async (msg, msgresult, client) => {
  // done *
  console.log(msgresult);
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
        let doneAccept = async () => {
          console.log(`${dummy ? "Dummy Done" : "Done"} for series:`, selectS.getName(), "chapter:", sC);
          let sCodes = selectS.statusCodes || defSC;
          let selectC = sC ? selectS.chapters.get(sC) : selectS.chapters.getCurrent();
          if (!selectC) {
            // ERROR: Could not find chapter
            show.error({ msg: `Could not find chapter #${sC}`, command: `done ${selectS.getName()}:${sC || "<current>"}` }, msg.channel);
          } else {
            // Found chapter
            let donechange = null;
            let e = 1;
            console.log(sT.toUpperCase(), "rest:", rest);
            let i = selectS.getIndexOfStatus(sT);
            i = i === 0 ? 0 : (i || -1);
            // TODO: change switch to regex
            switch (sT.toUpperCase().trim()) {
              case "TL":
              case "PR":
              case "TS":
              case "QC":
                donechange = [{ x: sT, e, i }];
                break;
              case "CL":
              case "RD":
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
                donechange = [{ e: e, x: sT, i }];
                break;
              case "CLRD":
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
                let i_c = selectS.getIndexOfStatus("CL");
                i_c = i_c === 0 ? i_c : (i_c || -1);
                let i_r = selectS.getIndexOfStatus("CL");
                i_r = i_r === 0 ? i_r : (i_r || -1);
                donechange = [{ x: "CL", i: i_c, e },
                { x: "RD", i: i_r, e }];
                break;
              case "RL":
                if (!rest)
                  return show.error({ msg: "DexID Not specified!", command: "done \\* **RL**" }, msg.channel);
                // TODO: LATE and WEEKSKIP implemetation 
                let RelMSG = await client.channels.fetch(Channels.release).then(async chn => {
                  return await chn.send(`${NOMENTION ? "" : selectS.mention ? `<@&${selectS.mention}> ` : ""}**${selectS.getName()} chapter ${selectC.id} released**\nOn MangaDex: https://mangadex.org/chapter/${rest.trim()}`);
                });
                if (!(!!e && typeof e === "object"))
                  e = { msgID: RelMSG.id, dexid: `${rest.trim()}` };
                else {
                  e.msgID = RelMSG.id;
                  e.dexid = rest.trim();
                }
                donechange = [{ x: sT, i, e }];
                let nc = selectS.chapters[selectS.chapters.indexOf(selectC) + 1]
                selectS.current = nc.id;
                selectC.sDate = selectC.startDate;
                selectC.startDate = null;
                nc.startDate = nDate;
                break;
            }
            if (donechange) {
              let changed = false;
              donechange.forEach(dC => {
                if (parseInt(dC.i) >= 0) {
                  changed = true;
                  if (!dummy)
                    selectC.status[parseInt(dC.i)] = dC.e;
                }
              });
              if (changed) {
                await SeriesData.save();
                // console.log(show);
                await show.last(msg.channel, { data: SeriesData.data, sdata: selectS, chdata: selectC });
                msg.channel.send(new Discord.MessageEmbed()
                  .setTitle(`${dummy ? "Dummy " : ""}Update ${selectS.getName()}(#${selectS.id})`)
                  .addField(`${dummy ? "Dummy " : ""}Done`, `${donechange.map((a, v) => v = `${a.x} ${a.e ? (a.e.partial ? "partial" : "") : ""}${a.e ? a.e.almost ? "almost" : "" : ""}${a.e ? (a.e.dexid || "") : ""}`).join(",")}`)
                ).then(m => m.delete({ timeout: 2500 }));
              }
            }
          }
        }
        if (Array.isArray(selectS)) {
          // ask for which series to use
          let qEx, i = await show.reactionSeriesSelect(msg.channel, selectS).catch(x => (qEx = x, -1));
          if (i !== -1) {
            return { i, series: selectS.map((a, v) => v = a.getName()).join(","), dummy };
            selectS = selectS[i];
            await doneAccept();
          } else
            return { ex: qEx, series: selectS.map((a, v) => v = a.getName()).join(","), dummy };
        } else {
          await doneAccept();
          if (dummy)
            return { dummy };
        }
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

let onrevoke = async (msg, msgresult, client) => {
  // revoke *
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
        let revokeAccept = async () => {
          console.log(`${dummy ? "Dummy revoke" : "Revoke"} for series:`, selectS.getName(), "chapter:", sC);
          let sCodes = selectS.statusCodes || defSC;
          let selectC = sC ? selectS.chapters.get(sC) : selectS.chapters.getCurrent();
          if (!selectC) {
            // ERROR: Could not find chapter
            show.error({ msg: `Could not find chapter #${sC}`, command: `revoke ${selectS.getName()}:${sC || "<current>"}` }, msg.channel);
          } else {
            // Found chapter
            let revokechange = null;
            let e = 0;
            let i = selectS.getIndexOfStatus(sT);
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
              case "RL":
                let RM = selectC.status[6].msgID;
                if (RM)
                  client.channels.fetch(Channels.release)
                    .then(c => {
                      c.messages.fetch(RM)
                      .then(m => m.delete()).catch(console.error);
                    });
                revokechange = [{ x: sT, i, e }];
                selectS.current = selectC.id;
                selectC.startDate = selectC.sDate || nDate;
                break;
              case "CLRD":
                let i_c = selectS.getIndexOfStatus("CL");
                i_c = i_c === 0 ? i_c : (i_c || -1);
                let i_r = selectS.getIndexOfStatus("CL");
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
                await show.last(msg.channel, { data: SeriesData.data, sdata: selectS, chdata: selectC });
                msg.channel.send(new Discord.MessageEmbed().setColor("#ff0000")
                  .setTitle(`${dummy ? "Dummy " : ""}Update ${selectS.getName()}(#${selectS.id})`)
                  .addField(`${dummy ? "Dummy " : ""}Revoke`, `${revokechange.map((a, v) => v = a.x).join(",")}`)
                ).then(msg => msg.delete({ timeout: 2500 }));
              }
            }
          }
        }
        if (Array.isArray(selectS)) {
          // ask for which series to use
          let i = await show.reactionSeriesSelect(msg.channel, selectS).catch(_ => -1);
          if (i !== -1) {
            return { i, series: selectS.map((a, v) => v = a.getName()).join(","), dummy };
            selectS = selectS[i];
            await revokeAccept();
          }
        } else {
          await revokeAccept();
          if (dummy)
            return { dummy };
        }
      }
    } else {
      // help
      show.help(msg.channel, 3);
    }
  } else {
    show.error(
      {
        msg: `This is not how you use **revoke** command! Check \`revoke help\` for more info!`,
        command: `${msg.content.replace(/([\*~_`])/g.replace("\\$1"))}`,
        timeout: 5000
      }, msg.channel);
  }
}

module.exports = (sd) => {
  SeriesData = sd;
  return { ondone, onrevoke };
}