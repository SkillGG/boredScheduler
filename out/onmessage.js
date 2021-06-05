"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const series_1 = require("./series");
const regexs_1 = require("./regexs");
const Discord = require("discord.js");
const DiscordIDs_1 = require("./DiscordIDs");
const show_1 = require("./show");
const strings_1 = require("./strings");
const NOMENTION = true;
exports.getNewDate = () => {
    let nDate = new Date();
    nDate.setMinutes(59);
    nDate.setSeconds(59);
    nDate.setHours(23);
    return nDate;
};
exports.ondone = (SeriesData, msg, msgresult) => __awaiter(void 0, void 0, void 0, function* () {
    // done *
    let doneresult;
    if (doneresult = regexs_1.RGX.done.exec(msgresult.trim())) {
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
                show_1.show.error({
                    msg: `Could not find series **${sS}**`,
                    command: `done **~~${sS}~~**:${sC || "<current>"} ${sT}${rest || ""}`,
                    timeout: 2500
                }, msg.channel);
            }
            else {
                let _selectS;
                let doneAccept = () => __awaiter(void 0, void 0, void 0, function* () {
                    console.log(`${dummy ? "Dummy Done" : "Done"} for series:`, _selectS.getName(), "chapter:", sC);
                    let sCodes = _selectS.statusCodes || strings_1.defaultStatusCodes;
                    let selectC = sC ? _selectS.chapters.get(sC) : _selectS.chapters.getCurrent();
                    if (!selectC) {
                        // ERROR: Could not find chapter
                        show_1.show.error({ msg: `Could not find chapter #${sC}`, command: `done ${_selectS.getName()}:${sC || "<current>"}` }, msg.channel);
                    }
                    else {
                        // Found chapter
                        let donechange;
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
                                    let newStatus;
                                    if (rest) {
                                        if (/partial/i.exec(rest)) {
                                            if (!newStatus || typeof newStatus !== "object")
                                                newStatus = { partial: !0, almost: !1 };
                                            else
                                                newStatus.partial = !(newStatus.almost = !1);
                                        }
                                        else if (/almost/i.exec(rest)) {
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
                                    let newStatus;
                                    if (rest) {
                                        if (/partial/i.exec(rest)) {
                                            if (!(!!newStatus && typeof newStatus === "object"))
                                                newStatus = { partial: !0, almost: !1 };
                                            else
                                                newStatus.partial = !(newStatus.almost = !1);
                                        }
                                        else if (/almost/i.exec(rest)) {
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
                                    let e = null;
                                    if (!rest)
                                        return show_1.show.error({ msg: "Site Not specified!", command: "done \\* **RL**" }, msg.channel);
                                    // TODO: LATE and WEEKSKIP implemetation 
                                    rest = rest.trim();
                                    let restRX;
                                    if (restRX = regexs_1.RGX.ReleaseRest.exec(rest)) {
                                        if (restRX.groups.dexid) {
                                            e = { msgID: null, dexid: restRX.groups.dexid };
                                        }
                                        if (restRX.groups.cubari) {
                                            e = { msgID: null, cubari: restRX.groups.cubari };
                                        }
                                        if (restRX.groups.link && restRX.groups.lname) {
                                            if (regexs_1.isStringURL(restRX.groups.link)) {
                                                e = { msgID: null, link: restRX.groups.link, name: restRX.groups.lname };
                                            }
                                        }
                                        let releaseLink = () => {
                                            if (series_1.isDexRelease(e))
                                                return `On MangaDex: ${strings_1.DexChapterLink}${e.dexid}`;
                                            if (series_1.isCubariRelease(e))
                                                return `On Cubari: ${strings_1.CubariChapterLink}${e.cubari}`;
                                            return `On ${e.name}: ${e.link}`;
                                        };
                                        let RelMSG = yield DiscordIDs_1.discordClient.channels.fetch(DiscordIDs_1.Channels.release).then((chn) => __awaiter(void 0, void 0, void 0, function* () {
                                            return yield chn
                                                .send(`${NOMENTION ? "" : _selectS.getMention()}**${_selectS.getName()} chapter ${selectC.id} released**\n${releaseLink()}`);
                                        }));
                                        e.msgID = RelMSG.id;
                                        donechange = [{ statusType: sT, foundIndex: i, newStatus: e }];
                                        let nc = _selectS.chapters[_selectS.chapters.indexOf(selectC) + 1];
                                        if (!nc) {
                                            _selectS.finished = true;
                                            break;
                                        }
                                        _selectS.current = nc.id;
                                        selectC.sDate = selectC.startDate;
                                        selectC.startDate = null;
                                        nc.startDate = exports.getNewDate();
                                    }
                                    else {
                                        show_1.show.error({
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
                                yield SeriesData.save();
                                // console.log(show);
                                yield show_1.show.last(msg.channel, { data: SeriesData.data, sdata: _selectS, chdata: selectC });
                                let changesInfo = (e) => {
                                    if (!e && typeof e === "object") {
                                        if (series_1.isBreakableStatus(e))
                                            return `${e.partial ? "partial" : ""}${e.almost ? "almost" : ""}`;
                                        if (series_1.isDexRelease(e))
                                            return `DexID: ${e.dexid}`;
                                        if (series_1.isCubariRelease(e))
                                            return `Cubari: ${e.cubari}`;
                                        return `Link ${e.name}: ${e.link}`;
                                    }
                                    return "";
                                };
                                msg.channel.send(new Discord.MessageEmbed()
                                    .setTitle(`${dummy ? "Dummy " : ""}Update ${_selectS.getName()}(#${_selectS.id})`)
                                    .addField(`${dummy ? "Dummy " : ""}Done`, `${donechange.map((a) => `${a.statusType} ${changesInfo(a.newStatus)}`).join(",")}`)).then(m => m.delete({ timeout: 2500 }));
                            }
                        }
                    }
                });
                if (Array.isArray(selectS)) {
                    // ask for which series to use
                    // TODO: come back when finished show.ts
                    let qEx, i = yield show_1.show.reactionSeriesSelect(msg.channel, selectS).catch(x => (qEx = x, -1));
                    if (i !== -1) {
                        _selectS = selectS[i];
                        yield doneAccept();
                        return { i, series: selectS.map((a) => a.getName()).join(","), dummy };
                    }
                    return { ex: qEx, series: selectS.map((a) => a.getName()).join(","), dummy };
                }
                _selectS = selectS;
                yield doneAccept();
                if (dummy)
                    return { dummy };
            }
        }
        else {
            // help
            show_1.show.help(msg.channel, 2);
            return { dummy: true };
        }
    }
    else {
        show_1.show.error({
            msg: `This is not how you use **done** command! Check \`done help\` for more info!`,
            command: `${msg.content.replace(/([\*~_`])/g, "\\$1")}`,
            timeout: 5000
        }, msg.channel);
    }
});
exports.onrevoke = (SeriesData, msg, msgresult) => __awaiter(void 0, void 0, void 0, function* () {
    // revoke *
    let revokeresult;
    if (revokeresult = regexs_1.RGX.done.exec(msgresult.trim())) {
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
                show_1.show.error({
                    msg: `Could not find series **${sS}**`,
                    command: `revoke **~~${sS}~~**:${sC} ${sT}${rest}`,
                    timeout: 2500
                }, msg.channel);
            }
            else {
                let _selectS;
                let revokeAccept = () => __awaiter(void 0, void 0, void 0, function* () {
                    console.log(`${dummy ? "Dummy revoke" : "Revoke"} for series:`, _selectS.getName(), "chapter:", sC);
                    let selectC = sC ? _selectS.chapters.get(sC) : _selectS.chapters.getCurrent();
                    if (!selectC) {
                        // ERROR: Could not find chapter
                        show_1.show.error({ msg: `Could not find chapter #${sC}`, command: `revoke ${_selectS.getName()}:${sC || "<current>"}` }, msg.channel);
                    }
                    else {
                        // Found chapter
                        let revokechange;
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
                                    DiscordIDs_1.discordClient.channels.fetch(DiscordIDs_1.Channels.release)
                                        .then(c => {
                                        c.messages.fetch(RM)
                                            .then(m => m.delete()).catch(console.error);
                                    });
                                revokechange = [{ statusType: sT, foundIndex: i, newStatus: defNS }];
                                _selectS.current = selectC.id;
                                selectC.startDate = selectC.sDate || exports.getNewDate();
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
                                yield SeriesData.save();
                                yield show_1.show.last(msg.channel, { data: SeriesData.data, sdata: _selectS, chdata: selectC });
                                msg.channel.send(new Discord.MessageEmbed().setColor("#ff0000")
                                    .setTitle(`${dummy ? "Dummy " : ""}Update ${_selectS.getName()}(#${_selectS.id})`)
                                    .addField(`${dummy ? "Dummy " : ""}Revoke`, `${revokechange.map((a) => a.statusType).join(",")}`)).then(msg => msg.delete({ timeout: 2500 }));
                            }
                        }
                    }
                });
                if (Array.isArray(selectS)) {
                    // ask for which series to use
                    // TODO: come back when finished show.ts
                    let qEx, i = yield show_1.show.reactionSeriesSelect(msg.channel, selectS).catch(x => (qEx = x, -1));
                    if (i !== -1) {
                        _selectS = selectS[i];
                        yield revokeAccept();
                        return { i, series: selectS.map((a) => a.getName()).join(","), dummy };
                    }
                    return { ex: qEx, series: selectS.map((a) => a.getName()).join(","), dummy };
                }
                _selectS = selectS;
                yield revokeAccept();
                if (dummy)
                    return { dummy };
            }
        }
        else {
            // help
            show_1.show.help(msg.channel, 3);
            return { dummy: true };
        }
    }
    else {
        show_1.show.error({
            msg: `This is not how you use **revoke** command! Check \`revoke help\` for more info!`,
            command: `${msg.content.replace(/([\*~_`])/g, "\\$1")}`,
            timeout: 5000
        }, msg.channel);
    }
});
//# sourceMappingURL=onmessage.js.map