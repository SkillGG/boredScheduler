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
require("dotenv").config({ path: ".env" });
const DiscordIDs_1 = require("./DiscordIDs");
const series_1 = require("./series");
const regexs_1 = require("./regexs");
// My files
const keep_alive_1 = require("./keep-alive");
keep_alive_1.default();
const show_1 = require("./show");
const onmessage_1 = require("./onmessage");
DiscordIDs_1.discordClient.login(process.env.TOKEN);
DiscordIDs_1.discordClient.on('rateLimit', (info) => {
    console.log(`Rate limit hit ${info.timeDifference ? info.timeDifference : info.timeout ? info.timeout : 'Unknown timeout '}`);
});
// on bot exit (^C)
process.on('SIGINT', function () {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Caught interrupt signal");
        show_1.show.clear().then(() => process.exit()).catch(e => { console.error(e); process.exit(); });
    });
});
let exitNormally = function () {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Closing via EXIT command");
        show_1.show.clear().then(() => process.exit()).catch(e => { console.error(e); process.exit(); });
    });
};
// console.log("Monoguri:", process.env.MONGOURI);
// on ready
DiscordIDs_1.discordClient.on("ready", () => {
    console.log("Ready");
    // get channel
    DiscordIDs_1.discordClient.channels.fetch(DiscordIDs_1.Channels.botlog)
        .then(r => {
        if (DiscordIDs_1.isTextChannel(r))
            DiscordIDs_1.Channels.obj.botlog = r;
    });
    DiscordIDs_1.discordClient.channels.fetch(DiscordIDs_1.Channels.release)
        .then(r => {
        if (DiscordIDs_1.isTextChannel(r))
            DiscordIDs_1.Channels.obj.release = r;
    });
    DiscordIDs_1.discordClient.channels.fetch(DiscordIDs_1.Channels.schedule)
        .then((r) => {
        if (DiscordIDs_1.isTextChannel(r)) {
            // Clean channel
            r.messages.fetch() // get messages
                .then(m => {
                if (!m)
                    return console.log("Got no messages!");
                console.log(`Got ${m.size} messages!`);
                // delete all messages (TODO: add await for deletion)
                m.forEach(e => e.delete());
            });
            series_1.loadDBData().then(_ => {
                if (series_1.SeriesData.loaded) {
                    show_1.show.all(series_1.SeriesData.data, r);
                }
            });
        }
    });
});
let onreaction = (reaction) => __awaiter(void 0, void 0, void 0, function* () {
    if (show_1.show.ReactionData.locked || !show_1.show.ReactionData.messageID || reaction.me)
        return;
    console.log("Got reaction on:", reaction.message.id, show_1.show.ReactionData.messageID);
    if (reaction.message.id === show_1.show.ReactionData.messageID) {
        show_1.show.ReactionData.response = reaction;
    }
});
// on message
let onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (!DiscordIDs_1.isTextChannel(msg.channel))
        return; // we don't read DMs
    let guild = msg.channel.guild;
    let member = guild.member(msg.author);
    if (member.roles.cache.has(DiscordIDs_1.Roles.staff)) {
        console.log("new message", msg.content);
        let muteid = null;
        if (muteid = /^(un)?mute\s*<@!(\d+)>\s*$/.exec(msg.content)) {
            let mutemember = guild.member(muteid[2]);
            // console.log(mutemember);
            if (!muteid[1])
                yield mutemember.roles.add(DiscordIDs_1.Roles.mute);
            else
                yield mutemember.roles.remove(DiscordIDs_1.Roles.mute);
            // log
            yield msg.channel.send(`${msg.author} ${muteid[1] ? "un" : ""}muted ${mutemember}!`);
            let logMsg = `Bot activity by ${msg.author}!
Command:` + `
>   *__${msg.content}__*`.replace(/<@!(.*?)>/g, `${mutemember.user.username}`);
            DiscordIDs_1.Channels.obj.botlog.send(logMsg);
        }
    }
    if (msg.channel.id === DiscordIDs_1.Channels.schedule) {
        // got good channel
        let msgRegex = /^(exit|reload|save|help|clear|debug|show|done|revoke|new|change|cease)(.*?)$/i;
        console.log("Message registered!", msg.content, msg.author.bot, msg.author.id, msg.id);
        let msgresult, showresult;
        // get which function was used
        let messageData = { log: true, content: msg.content, user: msg.author };
        // let nDate = getNewDate();
        if (msgresult = msgRegex.exec(msg.content)) {
            // switch by command
            switch (msgresult[1].toLowerCase()) {
                // case "react":
                //  if(!msg.author.bot){
                //     console.log("Test RH");
                //     let i = await show.reactionSeriesSelect(msg.channel, [{id:1,name:"A"},{id:2,name:"B"}]).catch(_=>-1);
                //     console.log("Index:", i);
                //   }
                // break;
                case "save":
                    yield series_1.SeriesData.save();
                    messageData.log = false;
                    break;
                case "reload":
                    yield series_1.SeriesData.reload();
                    messageData.log = false;
                    yield show_1.show.last(msg.channel, { data: series_1.SeriesData.data });
                    break;
                case "exit":
                    messageData.log = false;
                    exitNormally();
                    break;
                case "debug":
                    // debug *
                    show_1.show.debug();
                    messageData.log = false;
                    break;
                case "clear":
                    // clear *
                    show_1.show.clear();
                    messageData.log = false;
                    break;
                case "done":
                    messageData.choose = (yield onmessage_1.ondone(series_1.SeriesData, msg, msgresult[2])) || null;
                    if (messageData.choose && messageData.choose.dummy)
                        messageData.log = false;
                    break;
                case "revoke":
                    messageData.choose = (yield onmessage_1.onrevoke(series_1.SeriesData, msg, msgresult[2])) || null;
                    if (messageData.choose && messageData.choose.dummy)
                        messageData.log = false;
                    break;
                case "new":
                    if (messageData.choose && messageData.choose.dummy)
                        messageData.log = false;
                    break;
                case "change":
                    // 
                    break;
                case "cease":
                    // cease *
                    break;
                case "help":
                    messageData.log = false;
                    show_1.show.help(msg.channel, 4);
                    break;
                case "show":
                    messageData.log = false;
                    // show *
                    // show chapter / series data
                    if (showresult = regexs_1.RGX.show.exec(msgresult[2].trim())) {
                        // switch by show option
                        switch (showresult[1].toLowerCase()) {
                            case "help":
                                // help
                                show_1.show.help(msg.channel, 1);
                                break;
                            case "series":
                                // show series 2[:3]
                                if (!showresult[2])
                                    show_1.show.error({
                                        msg: `You didn't specify which series you want to see`,
                                        command: `show series ~~${showresult[2]}~~`
                                    }, msg.channel);
                                else {
                                    console.log("series #" + showresult[2]);
                                    let selectS = series_1.SeriesData.data.series.getSeries(showresult[2]); // get series
                                    if (!selectS) // series not found error
                                        show_1.show.error({
                                            command: `show series ~~**${showresult[2]}**~~`,
                                            msg: `Series **${showresult[2]}** not found!`
                                        }, msg.channel);
                                    else { // found series
                                        let showFn = (series) => __awaiter(void 0, void 0, void 0, function* () {
                                            if (!showresult[3]) { // didn't specify starting point
                                                console.log("Starting place not specified. Choosing current");
                                                return yield show_1.show.series(series, msg.channel, 0);
                                            }
                                            else { // showing from a starting point
                                                let s;
                                                console.log(`showing chapters ${s = showresult[3]}${parseInt(showresult[3]) + 3}`);
                                                return yield show_1.show.series(series, msg.channel, s);
                                            }
                                        });
                                        if (Array.isArray(selectS)) {
                                            // ask for which series to use
                                            console.log("Is array");
                                            let i = yield show_1.show.reactionSeriesSelect(msg.channel, selectS).catch(_ => -1);
                                            if (i !== -1) {
                                                messageData.log = true;
                                                messageData.choose = { i, series: selectS.map((a) => a.getName()).join(",") };
                                                selectS = selectS[i];
                                                yield showFn(selectS);
                                            }
                                        }
                                        else {
                                            yield showFn(selectS);
                                        }
                                    }
                                }
                                break;
                            case "chapter":
                                // show chapter 2:3
                                if (!showresult[2]) { // not specified error 
                                    show_1.show.error({
                                        msg: `You didn't specify which chapter you want to see`,
                                        command: `show chapter`
                                    }, msg.channel);
                                }
                                else {
                                    let selectS = series_1.SeriesData.data.series.getSeries(showresult[2]); // get series
                                    if (!selectS) { // series not found
                                        show_1.show.error({
                                            command: `show chapter ~~**${showresult[2]}**~~:${showresult[3]}`,
                                            msg: `Series **${showresult[2]}** not found!`
                                        }, msg.channel);
                                    }
                                    else {
                                        let showFn = (series) => __awaiter(void 0, void 0, void 0, function* () {
                                            let selectC = series.chapters.get(showresult[3]);
                                            if (!selectC) { // chapter not found
                                                return show_1.show.error({
                                                    msg: `Chapter ${showresult[3]} was not found!`,
                                                    command: `show chapter ${showresult[3]}`
                                                }, msg.channel);
                                            }
                                            else { // show chapter
                                                return yield show_1.show.chapter(series, selectC, msg.channel);
                                            }
                                        });
                                        if (Array.isArray(selectS)) {
                                            // ask for which series to use
                                            let i = yield show_1.show.reactionSeriesSelect(msg.channel, selectS).catch(_ => -1);
                                            let _selectS = null;
                                            if (i !== -1) {
                                                messageData.log = true;
                                                messageData.choose = { i, series: selectS.map((a) => a.getName()).join(",") };
                                                _selectS = selectS[i];
                                                yield showFn(_selectS);
                                            }
                                        }
                                        else {
                                            yield showFn(selectS);
                                        }
                                    }
                                }
                                break;
                            case "all":
                                yield show_1.show.all(series_1.SeriesData.data, msg.channel);
                                break;
                            case "ceased":
                                yield show_1.show.all(series_1.SeriesData.data, msg.channel, true);
                                break;
                        }
                    }
                    else {
                        show_1.show.error({
                            command: `show ~~**${msgresult[2]}**~~ ??`,
                            msg: `I don't know what you want me to show...
                (possible: \`series <series_number>:<start(1)>-<end(3)>[max 3]\` \`chapter <series_number>:<chap_number>\` \`all series\` \`ceased\`)`,
                            timeout: 5000
                        }, msg.channel);
                    }
                    break;
                default:
                    console.log("message:", msg);
                    break;
            }
        }
        else {
            if (!(msg.author.id === DiscordIDs_1.discordClient.user.id))
                show_1.show.help(msg.channel, 4);
        }
        // remove all non-bot messages
        if (!(msg.author.id === DiscordIDs_1.discordClient.user.id)) {
            if (!msg.deleted)
                msg.delete();
            yield show_1.show.log(DiscordIDs_1.Channels.obj.botlog, messageData);
        }
    }
});
// discord.js event handler
DiscordIDs_1.discordClient.on('message', onmessage);
DiscordIDs_1.discordClient.on('messageReactionAdd', onreaction);
//# sourceMappingURL=index.js.map