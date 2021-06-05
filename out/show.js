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
const strings_1 = require("./strings");
const Discord = require("discord.js");
const datefn_1 = require("./datefn");
const DiscordIDs_1 = require("./DiscordIDs");
const series_1 = require("./series");
// Embed Fields
let newField = (n, v, f) => { return { name: n || "", value: v || "", inline: f }; };
// let newEmptyField = f => newField("\u200b", "\u200b", f);
function debug() {
    console.log("Debug: ", ReactionData, embeds.map(e => ({ id: e.id, text: e.content, embed: e.embeds[0].title })));
}
let error = (o, channel) => {
    if (!channel)
        return console.error("chapter not specified!");
    if (DiscordIDs_1.isTextChannel(channel)) {
        let e = new Discord.MessageEmbed()
            .setTitle("Error").setColor("#ff0000")
            .addField("Message", `${o.msg || "Undefined error"}`)
            .addField(`Command`, `${o.command || "======="}`);
        channel.send(e).then(e => e.delete({ timeout: o.timeout || 2000 }));
    }
};
let embeds = [];
let clearEmbeds = () => __awaiter(void 0, void 0, void 0, function* () {
    for (let i = embeds.length - 1; i >= 0; i--) {
        if (!embeds[i].deleted) {
            console.log("Clearing embed " + i, embeds[i].id);
            yield embeds[i].delete().catch(console.error);
        }
    }
    if (ReactionData.messageID && ReactionData.messageID)
        DiscordIDs_1.discordClient.channels.fetch(ReactionData.channelID).then(ch => DiscordIDs_1.isTextChannel(ch) && (ch.messages.fetch(ReactionData.messageID).then(m => m.delete())));
    embeds = [];
});
let logMessage = (channel, msgData) => __awaiter(void 0, void 0, void 0, function* () {
    if (!msgData.log || !channel)
        return;
    if (typeof channel === "string") {
        // channel string
        if (!DiscordIDs_1.discordClient)
            return;
        channel = yield DiscordIDs_1.discordClient.channels.fetch(channel);
    }
    if (!DiscordIDs_1.isTextChannel(channel))
        return;
    let logMsg = `Bot activity by ${msgData.user}!
Command:
>   *__${msgData.content}__*`;
    if (msgData.choose) {
        console.log("Choice: ", msgData.choose);
        logMsg += `\n${msgData.user} chose: ${msgData.choose.series.split(",")[msgData.choose.i]}
Possible choices: ${msgData.choose.series.replace(",", ", ")}`;
    }
    channel.send(logMsg);
});
let help = (channel, command) => __awaiter(void 0, void 0, void 0, function* () {
    if (!channel || !DiscordIDs_1.isTextChannel(channel))
        return console.error("channel not specified!");
    yield clearEmbeds();
    if (!command)
        command = 1;
    let newEmbed = new Discord.MessageEmbed();
    switch (command) {
        case 1:
            // show
            newEmbed.setTitle("Help for `show`")
                .addField("General syntax:", "`show [help] <option>[ <number>[:<number>]]`")
                .addField("option:", `\`all\` - show all except ceased series
\`ceased\` - show all with ceased series
\`series <seriesID>[:<start:0=current>]\` - get chapter before, after and with id equal to "start"
\`chapter <seriesID>:<cnum>\` - get chapter #<chnum> from series <series>`)
                .addField("Examples:", `\`\`\`
show all
show chapter 1:12
show series Ope
show series 4:20\`\`\``);
            break;
        case 2:
            // done
            newEmbed.setTitle("Help for `done`")
                .addField("General syntax:", "`done [help] <seriesID>[<delim><number>] <type> <add> `")
                .addField("seriesID:", "Either id or part of the name of a series")
                .addField("delim:", "Either a space(` `) or a colon(`:`)")
                .addField("number:", "The chapter number (default: <current> chapter)")
                .addField("type:", `\`\`\`js
//What has been done:
/(TL|PR|CLRD|CL|RD|TS|QC|RL)/\`\`\``, true)
                .addField("add:", "Additional info", true)
                .addField("CL/RD/CLRD/TS <add>:", ` \`\`\`js
partial // the work has been partially done (you can start TS)
almost // the work is almost done\`\`\` `)
                .addField("RL <add>:", ` \`\`\`js
[manga]d[ex]:\\d+ // mangaDex chapterID
c[ub]:<CubariLink> // Cubari.moe
l[ink]:<LinkName>=<Link> // link to external source\`\`\` `)
                .addField("Examples:", `\`\`\`js
done 1:12 TS // done TS for Denjin N 12
done denjin N 15 TL // done TL for Denjin N 15
done hiro CL partial // done CL for Heroine wa... partially
done ope 4 RL dex:114189 // released OpeKan 4 on MangaDex (dexid: 114189)
done den RL cub:gist/J3kSv/21/1 // released current chapter of Denjin N (CubariLink:cubari.moe/read/gist/J3kSv/21/1)\`\`\``);
            break;
        case 3:
            // revoke
            newEmbed.setTitle("Help for `revoke`")
                .addField("General syntax:", "`revoke [help] <seriesID>[<delim><number>] <type>`")
                .addField("seriesID:", "Either id or part of the name of a series")
                .addField("delim:", "Either a space(` `) or a colon(`:`)")
                .addField("number:", "The chapter number (default: <current> chapter)")
                .addField("type:", `\`\`\`js
//What shoud be revoked
/(TL|PR|CLRD|CL|RD|TS|QC|RL)/\`\`\``, true)
                .addField("Examples:", `\`\`\`js
revoke 1:12 TS // revoke TS for Denjin N 12
revoke denjin N 15 TL // revoke TL for Denjin N 15
revoke ope 4 RL 114189 // revoke release of OpeKan 4
\`\`\``);
            break;
        case 4:
            // help
            newEmbed.setTitle("Help for `boredScheduler`")
                .addField("List of available commands:", "Check `<command> help` for help how to use them!")
                .addField("done", "The job has been completed")
                .addField("revoke", "Remove job completion mark")
                .addField("show", "Show info about our series")
                .addField("clear", "Clear all bot chat messages")
                .addField("debug", "Check if the bot works (if your `debug` message is removed, it works!)")
                .addField("~~change~~", "TODO (not yet implemented)")
                .addField("~~new~~", "TODO (not yet implemented)")
                .addField("~~cease~~", "TODO (not yet implemented)");
            break;
    }
    channel.send(newEmbed).then(e => embeds.push(e));
});
let ReactionData = { locked: !0, response: null };
let showReactionSeriesSelect = (channel, series, custom) => {
    if (!channel || !DiscordIDs_1.isTextChannel(channel))
        return console.error("Channel not specified!"), null;
    return new Promise((s, q) => __awaiter(void 0, void 0, void 0, function* () {
        let reactionTable = custom || strings_1.defaultReactions;
        reactionTable.splice(series.length);
        let Embed = new Discord.MessageEmbed().setTitle("Found multiple titles!");
        series.forEach((e, i) => {
            Embed
                .addField(`${e.getName()} (${e.id})`, `${reactionTable[i]}`, !0);
        });
        yield channel.send(Embed).then((message) => __awaiter(void 0, void 0, void 0, function* () {
            console.log("messageID", message.id);
            series.forEach((_e, i) => {
                message.react(reactionTable[i]);
            });
            message.react(strings_1.cancelReaction);
            ReactionData.locked = false;
            ReactionData.messageID = message.id;
            ReactionData.channelID = message.channel.id;
            let index;
            let gotReaction = yield new Promise((ss, qq) => __awaiter(void 0, void 0, void 0, function* () {
                let interval = setInterval(_ => {
                    if (ReactionData.response) {
                        if ((index = reactionTable.indexOf(ReactionData.response.emoji.name)) !== -1) {
                            clearInterval(interval);
                            ss("good");
                        }
                        else {
                            if (ReactionData.response.emoji.name === "❌") {
                                ss("cancel");
                            }
                            else {
                                error({ msg: "Wrong reaction!", command: `${ReactionData.response.emoji.name}` }, channel);
                                ReactionData.response.remove();
                                ReactionData.response = null;
                            }
                        }
                    }
                }, 1);
            }));
            ReactionData.response = null;
            ReactionData.messageID = null;
            ReactionData.channelID = null;
            message.delete();
            console.log("ReactionData:", ReactionData);
            if (gotReaction === "cancel")
                q("User canceled");
            if (index || index === 0)
                s(index);
            else
                q("Couldn't find emoji in the list!");
        }));
    }));
};
let LASTDATA = null;
let showLast = (channel, data) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("showing last!");
    if (!LASTDATA) {
        console.log("no LASTDATA!");
        if (!data)
            return;
        yield showAllData(data.data, channel, data.ceased);
    }
    else {
        switch (LASTDATA.t) {
            case 0:
                yield showAllData(data.data || LASTDATA.data, channel, data.ceased || LASTDATA.ceased);
                break;
            case 1:
                yield showChapterData(data.sdata || LASTDATA.sdata, data.chdata || LASTDATA.chdata, channel);
                break;
            case 2:
                yield showSeriesData(data.sdata || LASTDATA.sdata, channel, data.start || LASTDATA.start);
                break;
        }
    }
});
let DexArrayDoneText = (st) => {
    return `Released on ${st.reduce((a, v, i2) => {
        if (typeof v == "string")
            return a + `${i2 ? "\n" : ""}[MangaDex](${strings_1.DexChapterLink}${v})`;
        if (v.by !== null)
            return a + ` ${i2 ? "or\n " : ""} [MangaDex] by ${v.by}(${strings_1.DexChapterLink}${v.id})`;
        else
            return a + `${i2 ? " or\n" : ""}[MangaDex] by **[US](${strings_1.DexChapterLink}${v.id})**`;
    }, "")}`;
};
let getCLRDTSAlmostPartialInfo = (st, dt) => {
    if (st.almost || st.partial)
        return `${st.almost ? strings_1.ALMOST : st.partial ? strings_1.PARTIAL : "huh?"}\n${dt}`;
    return "";
};
let showAllData = (data, channel, ceased) => __awaiter(void 0, void 0, void 0, function* () {
    if (!channel || !DiscordIDs_1.isTextChannel(channel))
        return console.error("chapter not specified!");
    if (!data)
        return console.error("Data not specified!");
    console.log("Showing all!");
    LASTDATA = { t: 0, data: data, ceased };
    //console.log("data",data);
    yield clearEmbeds();
    data.series.forEach((e, _i) => {
        if (!ceased && e.ceased)
            return;
        let newEmbed = new Discord.MessageEmbed().setTitle(`${e.getName()}`).setColor("#0000ff");
        let scodes = e.statusCodes || strings_1.defaultStatusCodes;
        let curch = e.chapters.getCurrent();
        if (curch) {
            let sDate = new Date(curch.startDate);
            newEmbed.fields.push(newField(`${e.getName()}(#${e.id})`, `${curch.volume ? `Vol.${curch.volume}` : ""} Ch.${curch.id} ${curch.name ? `**"${curch.name}"**` : ""}`, false));
            newEmbed.fields.push(newField(`Start date`, datefn_1.getUTCDate(sDate, true)));
            sDate.setDate(sDate.getDate() + 1);
            if (curch.late)
                sDate.setDate(sDate.getDate() - (curch.late || 0));
            curch.status.forEach((x, z) => {
                let Deadline = datefn_1.getDeadline((e.schedule || { dows: [] }).dows[z], sDate, curch.weekSkip || null);
                let DeadText, DoneText = strings_1.DONE;
                if (Deadline.text != strings_1.NO_DEADLINE && Deadline.date.getTime() - (new Date().getTime()) < 0)
                    DeadText = strings_1.DEADLINE_after.replace("$date", `${Deadline.text}`);
                else
                    DeadText = strings_1.DEADLINE_before.replace("$date", `${Deadline.text}`);
                if (!!x && typeof x === "object") {
                    // TODO: more done properties
                    switch (scodes[z].toLowerCase()) {
                        case "cl":
                        case "rd":
                        case "ts":
                            if (!series_1.isBreakableStatus(x))
                                break;
                            DoneText = getCLRDTSAlmostPartialInfo(x, DeadText);
                            break;
                        case "rl":
                            if (series_1.isBreakableStatus(x))
                                break;
                            if (series_1.isDexRelease(x)) {
                                if (typeof x.dexid === "string") {
                                    DoneText = `Released on [MangaDex](${strings_1.DexChapterLink}${x.dexid})`;
                                    break;
                                }
                                else if (!Array.isArray(x.dexid)) {
                                    DoneText = `Released on [MangaDex](${strings_1.DexChapterLink}${x.dexid.id}) by ${x.dexid.by}`;
                                    break;
                                }
                                else {
                                    DoneText = DexArrayDoneText(x.dexid);
                                    break;
                                }
                            }
                            if (series_1.isCubariRelease(x)) {
                                DoneText = `Released on [Cubari](${strings_1.CubariChapterLink}${x.cubari})`;
                                break;
                            }
                            DoneText = `Released on [${x.name}](${x.link})`;
                            break;
                    }
                }
                newEmbed.fields.push(newField(`${scodes[z]}:`, `${x ? DoneText : DeadText}`, true));
            });
            newEmbed.setFooter(`chapter\u200b${e.id}:${curch.id}${"\u3000".repeat(125)}.`);
        }
        channel.send(newEmbed).then(m => { embeds.push(m); });
    });
});
let showChapterData = (sdata, chdata, channel) => __awaiter(void 0, void 0, void 0, function* () {
    if (!channel || !DiscordIDs_1.isTextChannel(channel))
        return console.error("channel not specified!");
    if (!sdata || !chdata)
        return console.error("data not specified!");
    LASTDATA = { t: 1, sdata, chdata };
    console.log("Showing chapter");
    yield clearEmbeds();
    let newembed = new Discord.MessageEmbed()
        .setTitle(`${sdata.getName()} ${chdata.volume ? `Vol.${chdata.volume} ` : ``}Ch.${chdata.id} ${chdata.name || ""}`).setColor("#0000ff")
        .setFooter(`chapter ${sdata.id}:${chdata.id}`);
    let scodes = sdata.statusCodes || strings_1.defaultStatusCodes;
    let sDate;
    if (chdata.startDate) {
        sDate = new Date(chdata.startDate);
        sDate.setDate(sDate.getDate() + 1);
    }
    else {
        sDate = new Date(chdata.sDate || -1);
    }
    console.log("chData: ", chdata, "sDate:", sDate);
    if (sDate.getTime() >= 0 && chdata.late)
        sDate.setDate(sDate.getDate() - chdata.late);
    if (sDate.getTime() < 0)
        sDate = null;
    chdata.status.forEach((st, i) => {
        let Deadline = datefn_1.getDeadline((sdata.schedule || { dows: [] }).dows[i], sDate, chdata.weekSkip);
        let DeadText, DoneText = strings_1.DONE;
        if (Deadline.text != strings_1.NO_DEADLINE && Deadline.date.getTime() - (new Date().getTime()) < 0)
            DeadText = strings_1.DEADLINE_after.replace("$date", Deadline.text);
        else
            DeadText = `Deadline: ${Deadline.text}`;
        if (!!st && typeof st === "object") {
            switch (scodes[i].toLowerCase()) {
                case "cl":
                case "rd":
                case "ts":
                    if (!series_1.isBreakableStatus(st))
                        break;
                    DoneText = getCLRDTSAlmostPartialInfo(st, DeadText);
                    break;
                case "rl":
                    if (series_1.isBreakableStatus(st))
                        break;
                    if (series_1.isDexRelease(st)) {
                        if (typeof st.dexid === "string")
                            DoneText = `Released on [MangaDex](${strings_1.DexChapterLink}${st.dexid})`;
                        else if (!Array.isArray(st.dexid))
                            DoneText = `Released on [MangaDex](${strings_1.DexChapterLink}${st.dexid.id}) by ${st.dexid.by}`;
                        else
                            DoneText = DexArrayDoneText(st.dexid);
                        break;
                    }
                    if (series_1.isCubariRelease(st)) {
                        DoneText = `Released on [Cubari](${strings_1.CubariChapterLink}${st.cubari})`;
                        break;
                    }
                    DoneText = `Released on [${st.name}](${st.link})`;
                    break;
            }
        }
        newembed.fields.push(newField(scodes[i], `${st ? DoneText : DeadText}`, true));
    });
    channel.send(newembed).then(x => embeds.push(x));
});
let showSeriesData = (sdata, channel, start) => __awaiter(void 0, void 0, void 0, function* () {
    if (!channel || !DiscordIDs_1.isTextChannel(channel))
        return console.error("chapter not specified!");
    if (!sdata)
        return console.error("Data not specified!");
    if (!start && `${start}` !== "0")
        return console.error("Start not defined!");
    if (typeof start === "string" && !parseFloat(start) && `${start}` !== "0.0")
        return console.error("Start is not a number!");
    start = series_1.getFloatFromSN(start);
    if (start === 0)
        start = parseFloat(sdata.chapters.getCurrent().id) - Math.floor(sdata.parent.showVal / 2);
    let end = start + sdata.parent.showVal;
    LASTDATA = { t: 2, sdata, start };
    console.log("Showing series");
    yield clearEmbeds();
    channel.send(new Discord.MessageEmbed().setTitle(`${sdata.getName()}(#${sdata.id}) ${(sdata.ceased ? "~~Ceased~~" : "On-going")}`)
        .addField(`Chapters:`, ` ${start}-${end}`, true).setFooter(`series\u200b${sdata.id}${"\u3000".repeat(125)}.`).setColor("#0000ff")).then(m => { embeds.push(m); });
    let scodes = sdata.statusCodes || strings_1.defaultStatusCodes;
    sdata.chapters.forEach((chapter, chi, cha) => {
        if (parseInt(chapter.id) < series_1.getIntFromSN(start) || parseInt(chapter.id) > end)
            return;
        console.log("Show chapter: " + chapter.id, chapter.startDate);
        let sDate;
        if (chapter.startDate) {
            sDate = new Date(chapter.startDate);
            sDate.setDate(sDate.getDate() + 1);
        }
        else {
            sDate = new Date(chapter.sDate || -1);
        }
        if (sDate.getTime() > 0 && chapter.late)
            sDate.setDate(sDate.getDate() - chapter.late);
        if (sDate.getTime() < 0)
            sDate = new Date(-1);
        let chapterEmbed = new Discord.MessageEmbed().setTitle(`${chapter.volume ? `Vol.${chapter.volume} ` : ""}Ch.${chapter.id}`).setColor("#0000ff");
        chapterEmbed.fields.push(newField(`Name`, `${chapter.name ? chapter.name : "------"}`, false));
        chapterEmbed.fields.push(newField(`Progress`, `${chapter.status.reduce((a, v) => a + +(!!v), 0)}/${chapter.status.length}`));
        chapter.status.forEach((st, i) => {
            console.log("sDate:", sDate);
            let Deadline = datefn_1.getDeadline((sdata.schedule || { dows: [] }).dows[i], sDate, chapter.weekSkip);
            let DeadText, DoneText = strings_1.DONE;
            if (Deadline.text != strings_1.NO_DEADLINE && Deadline.date.getTime() - (new Date().getTime()) < 0)
                DeadText = `**~~Deadline: ${Deadline.text}~~**`;
            else
                DeadText = `Deadline: ${Deadline.text}`;
            if (!!st && typeof st === "object") {
                switch (scodes[i].toLowerCase()) {
                    case "cl":
                    case "rd":
                    case "ts":
                        if (!series_1.isBreakableStatus(st))
                            break;
                        DoneText = getCLRDTSAlmostPartialInfo(st, DeadText);
                        break;
                    case "rl":
                        if (series_1.isBreakableStatus(st))
                            break;
                        if (series_1.isDexRelease(st)) {
                            if (typeof st.dexid === "string")
                                DoneText = `Released on [MangaDex](${strings_1.DexChapterLink}${st.dexid})`;
                            else if (!Array.isArray(st.dexid))
                                DoneText = `Released on [MangaDex](${strings_1.DexChapterLink}${st.dexid.id}) by ${st.dexid.by}`;
                            else
                                DoneText = DexArrayDoneText(st.dexid);
                            break;
                        }
                        if (series_1.isCubariRelease(st)) {
                            DoneText = `Released on [Cubari](${strings_1.CubariChapterLink}${st.cubari})`;
                            break;
                        }
                        DoneText = `Released on [${st.name}](${st.link})`;
                        break;
                }
            }
            chapterEmbed.fields.push(newField(scodes[i], `${st ? DoneText : DeadText}`, true));
        });
        chapterEmbed.setFooter(`chapter\u200b${sdata.id}:${chapter.id}${"\u3000".repeat(125)}.`);
        channel.send(chapterEmbed).then(m => { embeds.push(m); });
    });
});
exports.show = {
    help, error, debug,
    last: showLast,
    log: logMessage,
    all: showAllData,
    chapter: showChapterData,
    series: showSeriesData,
    reactionSeriesSelect: showReactionSeriesSelect,
    ReactionData,
    clear: clearEmbeds
};
exports.newf = newField;
//# sourceMappingURL=show.js.map