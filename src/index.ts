require("dotenv").config({ path: ".env" });
import { Guild, Message, MessageReaction, User } from "discord.js";
import { Roles, Channels, isTextChannel, discordClient } from "./DiscordIDs"
import { Series, Chapter, SeriesData, loadDBData } from "./series";
import { RGX } from "./regexs";

import keepAlive from "./keep-alive";
keepAlive();

import { show } from "./show";
import { ondone, onnew, onrevoke } from "./onmessage";
import { Site } from "./site";

discordClient.login(process.env.TOKEN);

discordClient.on('rateLimit', (info) => {
  console.log(`Rate limit hit ${info.timeDifference ? info.timeDifference : info.timeout ? info.timeout : 'Unknown timeout '}`)
});

// on bot exit (^C)

process.on('SIGINT', async function () {
  console.log("Caught interrupt signal");
  show.clear().then(() => process.exit()).catch(e => { console.error(e); process.exit(); });
});

let exitNormally = async function () {
  console.log("Closing via EXIT command");
  show.clear().then(() => process.exit()).catch(e => { console.error(e); process.exit(); });
}

// console.log("Monoguri:", process.env.MONGOURI);

// on ready
discordClient.on("ready", () => {
  console.log("Ready");
  // get channel
  discordClient.channels.fetch(Channels.botlog)
    .then(r => {
      if (isTextChannel(r))
        Channels.obj.botlog = r;
    });
  discordClient.channels.fetch(Channels.release)
    .then(r => {
      if (isTextChannel(r))
        Channels.obj.release = r;
    });
  discordClient.channels.fetch(Channels.schedule)
    .then((r) => {
      if (isTextChannel(r)) {
        // Clean channel
        r.messages.fetch() // get messages
          .then(m => {
            if (!m) return console.log("Got no messages!");
            console.log(`Got ${m.size} messages!`,);
            // delete all messages (TODO: add await for deletion)
            m.forEach(e => e.delete());
          });
        loadDBData().then(_ => {
          if (SeriesData.loaded) {
            show.all(SeriesData.data, r);
          }
        });
      }
    });
});

let onreaction = async (reaction: MessageReaction): Promise<void> => {
  if (show.ReactionData.locked || !show.ReactionData.messageID || reaction.me) return;
  console.log("Got reaction on:", reaction.message.id, show.ReactionData.messageID);
  if (reaction.message.id === show.ReactionData.messageID) {
    show.ReactionData.response = reaction;
  }
}

// on message
let onmessage = async (msg: Message): Promise<void> => {
  if (!isTextChannel(msg.channel)) return; // we don't read DMs
  let guild: Guild = msg.channel.guild;
  let member = guild.member(msg.author);
  if (member.roles.cache.has(Roles.staff)) {
    console.log("new message", msg.content);
    let muteid: RegExpExecArray = null;
    if (muteid = /^(un)?mute\s*<@!(\d+)>\s*$/.exec(msg.content)) {
      let mutemember = guild.member(muteid[2]);
      // console.log(mutemember);
      if (!muteid[1])
        await mutemember.roles.add(Roles.mute);
      else
        await mutemember.roles.remove(Roles.mute);

      // log
      await msg.channel.send(`${msg.author} ${muteid[1] ? "un" : ""}muted ${mutemember}!`);
      let logMsg = `Bot activity by ${msg.author}!
Command:` + `
>   *__${msg.content}__*`.replace(/<@!(.*?)>/g, `${mutemember.user.username}`);
      Channels.obj.botlog.send(logMsg);
    }
  }
  if (msg.channel.id === Channels.schedule) {
    // got good channel
    let msgRegex = /^(exit|reload|save|help|clear|debug|show|done|revoke|new|change|cease)(.*?)$/i;
    console.log("Message registered!", msg.content, msg.author.bot, msg.author.id, msg.id);
    let msgresult: RegExpExecArray, showresult: RegExpExecArray;
    // get which function was used
    let messageData: { log: boolean, content: string, user: User, choose?: any } = { log: true, content: msg.content, user: msg.author };
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
          await SeriesData.save();
          messageData.log = false;
          break;
        case "reload":
          await SeriesData.reload();
          messageData.log = false;
          await show.last(msg.channel, { data: SeriesData.data });
          break;
        case "exit":
          messageData.log = false;
          exitNormally();
          break;
        case "debug":
          // debug *
          show.debug();
          messageData.log = false;
          break;
        case "clear":
          // clear *
          show.clear();
          messageData.log = false;
          break;
        case "done":
          messageData.choose = await ondone(SeriesData, msg, msgresult[2]) || null;
          if (messageData.choose && messageData.choose.dummy)
            messageData.log = false;
          break;
        case "revoke":
          messageData.choose = await onrevoke(SeriesData, msg, msgresult[2]) || null;
          if (messageData.choose && messageData.choose.dummy)
            messageData.log = false;
          break;
        case "new":
          console.log("onnewReturn: ", messageData.choose = await onnew(SeriesData, msg, msgresult[2]) || null);
          //if (messageData.choose && (messageData.choose.dummy || messageData.choose.silent))
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
          show.help(msg.channel, 4);
          break;
        case "show":
          messageData.log = false;
          // show *
          // show chapter / series data
          if (showresult = RGX.show.exec(msgresult[2].trim())) {
            // switch by show option
            switch (showresult[1].toLowerCase()) {
              case "help":
                // help
                show.help(msg.channel, 1);
                break;
              case "series":
                // show series 2[:3]
                if (!showresult[2])
                  show.error({
                    msg: `You didn't specify which series you want to see`,
                    command: `show series ~~${showresult[2]}~~`
                  }, msg.channel);
                else {
                  console.log("series #" + showresult[2]);
                  let selectS = SeriesData.data.series.getSeries(showresult[2]); // get series
                  if (!selectS)  // series not found error
                    show.error({
                      command: `show series ~~**${showresult[2]}**~~`,
                      msg: `Series **${showresult[2]}** not found!`
                    }, msg.channel);
                  else { // found series
                    let showFn = async (series: Series) => {
                      if (!showresult[3]) { // didn't specify starting point
                        console.log("Starting place not specified. Choosing current");
                        return await show.series(series, msg.channel, 0);
                      }
                      else { // showing from a starting point
                        let s;
                        console.log(`showing chapters ${s = showresult[3]}${parseInt(showresult[3]) + 3}`);
                        return await show.series(series, msg.channel, s);
                      }
                    }
                    if (Array.isArray(selectS)) {
                      // ask for which series to use
                      console.log("Is array");
                      let i = await show.reactionSeriesSelect(msg.channel, selectS).catch(_ => -1);
                      if (i !== -1) {
                        messageData.log = true;
                        messageData.choose = { i, series: selectS.map((a) => a.getName()).join(",") };
                        selectS = selectS[i];
                        await showFn(selectS);
                      }
                    } else {
                      await showFn(selectS);
                    }
                  }
                }
                break;
              case "chapter":
                // show chapter 2:3
                if (!showresult[2]) { // not specified error 
                  show.error({
                    msg: `You didn't specify which chapter you want to see`,
                    command: `show chapter`
                  }, msg.channel);
                } else {
                  let selectS = SeriesData.data.series.getSeries(showresult[2]); // get series
                  if (!selectS) { // series not found
                    show.error({
                      command: `show chapter ~~**${showresult[2]}**~~:${showresult[3]}`,
                      msg: `Series **${showresult[2]}** not found!`
                    }, msg.channel);
                  } else {
                    let showFn = async (series: Series) => {
                      let selectC: Chapter = series.chapters.get(showresult[3]);
                      if (!selectC) { // chapter not found
                        return show.error(
                          {
                            msg: `Chapter ${showresult[3]} was not found!`,
                            command: `show chapter ${showresult[3]}`
                          }
                          , msg.channel);
                      } else { // show chapter
                        return await show.chapter(series, selectC, msg.channel);
                      }
                    }
                    if (Array.isArray(selectS)) {
                      // ask for which series to use
                      let i = await show.reactionSeriesSelect(msg.channel, selectS).catch(_ => -1);
                      let _selectS: Series = null;
                      if (i !== -1) {
                        messageData.log = true;
                        messageData.choose = { i, series: selectS.map((a) => a.getName()).join(",") };
                        _selectS = selectS[i];
                        await showFn(_selectS);
                      }
                    } else {
                      await showFn(selectS);
                    }
                  }
                }
                break;
              case "all":
                await show.all(SeriesData.data, msg.channel);
                break;
              case "ceased":
                await show.all(SeriesData.data, msg.channel, true);
                break;
            }
          } else {
            show.error(
              {
                command: `show ~~**${msgresult[2]}**~~ ??`,
                msg: `I don't know what you want me to show...
                (possible: \`series <series_number>:<start(1)>-<end(3)>[max 3]\` \`chapter <series_number>:<chap_number>\` \`all series\` \`ceased\`)`
                , timeout: 5000
              },
              msg.channel
            );
          }
          break;
        default:
          console.log("message:", msg);
          break;
      }
    } else {
      if (!(msg.author.id === discordClient.user.id)) show.help(msg.channel, 4);
    }
    // remove all non-bot messages
    if (!(msg.author.id === discordClient.user.id)) {
      if (!msg.deleted)
        msg.delete();
      await show.log(Channels.obj.botlog, messageData);
    }
  }
}

// discord.js event handler
discordClient.on('message', onmessage);
discordClient.on('messageReactionAdd', onreaction);