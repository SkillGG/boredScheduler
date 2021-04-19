// My files
const {SeriesData} = require("./series.js");
const {show,newf,newfb} = require("./show.js");
const {change} = require("./change.js");
const {_new} = require("./new.js");
const {getNextDayOfWeek,getDayOfWeekAfterWeeks,dow,gdt} = require("./datefn.js");
const {Site} = require("./site.js");
const {ondone, onrevoke} = require("./onmessage.js")(SeriesData);
const {RGX} = require("./regexs.js");
require("./keep-alive.js")();

const Roles = {
  staff:"777842454401253377",
  mute:"815575253887615006"
}
const Channels = {
  obj:{},
  schedule:"803360266854072372",
  botlog:"813148662707519549",
  release:"777815091650232362"// "805919561064382495"// 
}
const NOMENTION = false;

// Discord.js
const Discord = require("discord.js");
const client = new Discord.Client();
require("dotenv").config();
client.login(process.env.TOKEN);

client.on('rateLimit', (info) => {
  console.log(`Rate limit hit ${info.timeDifference ? info.timeDifference : info.timeout ? info.timeout: 'Unknown timeout '}`)
});

// on bot exit (^C)
process.on('SIGINT', async function() {
    console.log("Caught interrupt signal");
    show.clear().then(e=>process.exit()).catch(e=>{console.error(e);process.exit();});
});

let exitNormally = async function() {
    console.log("Closing via EXIT command");
    show.clear().then(e=>process.exit()).catch(e=>{console.error(e);process.exit();});
}

// on ready
client.on("ready", ()=>{
  console.log("Ready");
  // get channel
  client.channels.fetch(Channels.botlog)
  .then(r=>{
    Channels.obj.botlog = r;
  });
  client.channels.fetch(Channels.release)
  .then(r=>{
    Channels.obj.release = r;
  });
  client.channels.fetch(Channels.schedule)
  .then(r=>{
    // Clean channel
    Channels.obj.schedule = r;
    r.messages.fetch() // get messages
    .then(m=>{
      if(!m) return conosle.log("Got no messages!");
      console.log(`Got ${m.size} messages!`,);
      // delete all messages (TODO: add await for deletion)
      m.forEach(e=>e.delete());
    });
    let showInter = setInterval(e=>{
      if(SeriesData.loaded){
        clearInterval(showInter);
        show.all(SeriesData.data,r);
      }
    },100);
  });
});

let onreaction = async (reaction)=>{
  if(show.ReactionData.locked || !show.ReactionData.messageID || reaction.me) return;
  console.log("Got reaction on:", reaction.message.id, show.ReactionData.messageID);
  if(reaction.message.id === show.ReactionData.messageID){
    show.ReactionData.response = reaction;
  }
}

// on message
let onmessage = async (msg)=>{
  let x = null;
  let guild = msg.channel.guild;
  let member = guild.member(msg.author);
  if(member.roles.cache.has(Roles.staff)){
    console.log(msg.content);
    let muteid=null;
    if(muteid=/^(un)?mute\s*<@!(\d+)>\s*$/.exec(msg.content)){
      let mutemember = guild.member(muteid[2]);
      // console.log(mutemember);
      if(!muteid[1])
        await mutemember.roles.add(Roles.mute);
      else
        await mutemember.roles.remove(Roles.mute);

      // log
      await msg.channel.send(`${msg.author} ${muteid[1]?"un":""}muted ${mutemember}!`);
      let logMsg = `Bot activity by ${msg.author}!
Command:` + `
>   *__${msg.content}__*`.replace(/<@!(.*?)>/g, `${mutemember.user.username}`);
      Channels.obj.botlog.send(logMsg);
    }
  }
  if(msg.channel.id === Channels.schedule){
    // got good channel
    let msgRegex = /^(exit|reload|save|help|clear|debug|show|done|revoke|new|change|cease)(.*?)$/i;
    console.log("Message registered!", msg.content, msg.author.bot, msg.author.id, msg.id);
    let msgresult,showresult,doneresult,revokeresult,newresult,changeresult,ceaseresult;
    // get which function was used
    let messageData = {log:true,content:msg.content, user:msg.author};
    let nDate = new Date();
    nDate.setMinutes(59);nDate.setSeconds(59);nDate.setHours(23);
    if(msgresult=msgRegex.exec(msg.content)){
      // switch by command
      switch(msgresult[1].toLowerCase()){
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
          await show.last(msg.channel, {data:SeriesData.data});
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
          console.log("get message done");
          messageData.choose = await ondone(msg, msgresult, client) || null;
          console.log(messageData.choose);
          if(messageData.choose && messageData.choose.dummy)
            messageData.log = false;
        break;
        case "revoke":
          messageData.choose = await onrevoke(msg, msgresult, client) || null;
          if(messageData.choose && messageData.choose.dummy)
            messageData.log = false;
        break;
        case "new":
          // new *
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
          if(showresult = RGX.show.exec(msgresult[2].trim())){
            // switch by show option
            let showFn;
            switch(showresult[1].toLowerCase()){
              case "help":
                // help
                show.help(msg.channel,1);
              break;
              case "series":
                // show series 2[:3]
                if(!showresult[2])
                  show.error({
                    msg:`You didn't specify which series you want to see`,
                    command:`show series ~~${showresult[2]}~~`
                  },msg.channel);
                else{
                  console.log("series #" + showresult[2]);
                  let selectS = SeriesData.data.series.getSeries(showresult[2]); // get series
                  if(!selectS)  // series not found error
                    show.error({
                        command: `show series ~~**${showresult[2]}**~~`,
                        msg: `Series **${showresult[2]}** not found!`
                      },msg.channel);
                  else { // found series
                    showFn = async ()=>{
                      if(!showresult[3]){ // didn't specify starting point
                        console.log("Starting place not specified. Choosing current");
                        return await show.series(selectS, msg.channel, 0);
                      }
                      else{ // showing from a starting point
                        let s,e;
                        console.log(`showing chapters ${s=showresult[3]}${parseInt(showresult[3])+3}`);
                        return await show.series(selectS, msg.channel, s);
                      }
                    }
                    if(Array.isArray(selectS)){
                      // ask for which series to use
                      console.log("Is array");
                      let i = await show.reactionSeriesSelect(msg.channel, selectS).catch(_=>-1);
                      if(i !== -1){
                        messageData.log = true;
                        messageData.choose = {i,series:selectS.map((a,v)=>v=a.getName()).join(",")};
                        selectS = selectS[i];
                        await showFn();
                      }
                    }else{
                      await showFn();
                    }
                  }
                }
              break;
              case "chapter":
                // show chapter 2:3
                if(!showresult[2]){ // not specified error 
                  show.error({
                    msg:`You didn't specify which chapter you want to see`,
                    command:`show chapter`
                  },msg.channel);
                } else{
                  let selectS = SeriesData.data.series.getSeries(showresult[2]); // get series
                  if(!selectS){ // series not found
                    show.error({command: `show chapter ~~**${showresult[2]}**~~:${showresult[3]}`,
                      msg: `Series **${showresult[2]}** not found!`}, msg.channel);
                  } else {
                    showFn = async ()=>{
                      let selectC = selectS.chapters.get(showresult[3]);
                      if(!selectC){ // chapter not found
                        return show.error(
                        {
                          msg:`Chapter ${showresult[3]} was not found!`,
                          command:`show chapter ${showresult[3]}`
                        }
                        ,msg.channel);
                      } else{ // show chapter
                        return await show.chapter(selectS,selectC,msg.channel);
                      }
                    }
                    if(Array.isArray(selectS)){
                      // ask for which series to use
                      let i = await show.reactionSeriesSelect(msg.channel, selectS).catch(_=>-1);
                      if(i !== -1){
                        messageData.log = true;
                        messageData.choose = {i,series:selectS.map((a,v)=>v=a.getName()).join(",")};
                        selectS = selectS[i];
                        await showFn();
                      }
                    }else{
                      await showFn();
                    }
                  }
                }
              break;
              case "all":
                await show.all(SeriesData.data, msg.channel);
              break;
              case "ceased":
                await show.all(SeriesData.data, msg.channel,true);
              break;
            }
          } else {
            show.error(
              {
                command:`show ~~**${msgresult[2]}**~~ ??`,
                msg: `I don't know what you want me to show...
                (possible: \`series <series_number>:<start(1)>-<end(3)>[max 3]\` \`chapter <series_number>:<chap_number>\` \`all series\` \`ceased\`)`
                ,timeout:5000
              },
              msg.channel
            );
          }
        break;
        default:
          console.log(msg);
          break;
      }
    } else {
      if(!(msg.author.id===client.user.id))show.help(msg.channel,4);
    }
    // remove all non-bot messages
    if(!(msg.author.id===client.user.id)){
      if(!msg.deleted)
        msg.delete();
      await show.log(Channels.obj.botlog, messageData, client);
    }
  }
}

// discord.js event handler
client.on('message', onmessage);
client.on('messageReactionAdd', onreaction); 