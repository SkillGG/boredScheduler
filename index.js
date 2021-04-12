// My files
const {SeriesData} = require("./series.js");
const {show,newf,newfb} = require("./show.js");
const {change} = require("./change.js");
const {_new} = require("./new.js");
const {getNextDayOfWeek,getDayOfWeekAfterWeeks,dow,gdt} = require("./datefn.js");
// require("./keep-alive.js");

// user consts
const RGX = {
  /*
    $1 - help
    $2 - <SERIES_IDENTIFIER> = #+ / a-z+
    $3 - #+
    $4 - TL|PR|CL|RD|TS|QC|RL
    $5 - .*
  */
  done: /^\s*(help.*$)|(?:(?:([^\r\n\t\f\v]+?)[\s:]+(\d[\d.]*)?)\s*(TL|PR|CLRD|CL|RD|TS|QC|RL)(.+?)?$)/i,
  /*
    $1 - help/chapter/series/all/ceased
    $2 - #+
    $3 - #+[.#+]
  */
  show: /^\s*(help|chapter|series|all|ceased)\s*(?:([^\r\n\t\f\v]+?)[\s:]*(\d[\d.]*)?)?$/i,
  _new: /^\s*(chapter)$/i
}
const Channels = {
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
  client.channels.fetch(Channels.schedule)
  .then(r=>{
    // Clean channel
    console.log("Cleaning channel");
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
  if(msg.channel.id === Channels.schedule){
    // got good channel
    let msgRegex = /^(exit|save|help|clear|debug|show|done|revoke|new|change|cease)(.*?)$/i;
    console.log("Message registered!", msg.content, msg.author.bot, msg.author.id, client.user.id);
    let msgresult,showresult,doneresult,revokeresult,newresult,changeresult,ceaseresult;
    // get which function was used
    let messageData = {log:true,content:msg.content, user:msg.author};
    let nDate = new Date(); nDate.setHours(1);nDate.setMinutes(0);nDate.setSeconds(1);
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
          // done *
          if(doneresult = RGX.done.exec(msgresult[2].trim())){
            if(!doneresult[1]){
              // selectedSeries, selectedChapter, selectedType, rest
              let sS = doneresult[2], sC=doneresult[3],sT=doneresult[4],rest=doneresult[5];
              let selectS = SeriesData.data.series.getSeries(sS);
              if(!selectS){
                show.error(
                  {
                    msg:`Could not find series **${sS}**`,
                    command:`done **~~${sS}~~**:${sC||"<current>"} ${sT}${rest||""}`,
                    timeout:2500
                  }
                  ,msg.channel);
              }else{
                let doneAccept = async ()=>{
                  console.log("Done for series:", selectS.getName(), "chapter:", sC);
                  let sCodes = selectS.statusCodes || defSC;
                  let selectC = sC?selectS.chapters.get(sC):selectS.chapters.getCurrent();
                  if(!selectC){
                    // ERROR: Could not find chapter
                    show.error({msg:`Could not find chapter #${sC}`,command:`done ${selectS.getName()}:${sC||"<current>"}`},msg.channel);
                  }else{
                    // Found chapter
                    let donechange = null;
                    let e = 1;
                    console.log(sT.toUpperCase(), "rest:", rest);
                    let i = selectS.getIndexOfStatus(sT);
                    i = i===0?0:(i||-1);
                    // TODO: change switch to regex
                    switch(sT.toUpperCase().trim()){
                      case "TL":
                      case "PR":
                      case "TS":
                      case "QC":
                        donechange = [{x:sT,e,i}];
                      break;
                      case "CL":
                      case "RD":
                        if(rest){
                          if(/partial/i.exec(rest)){
                            if(!(!!e&&typeof e==="object") )
                              e = {partial:!0,almost:!1};
                            else
                              e.partial = !(e.almost=!1);
                          }else if(/almost/i.exec(rest)){
                            if(!(!!e&&typeof e==="object") )
                              e = {partial:!1,almost:!0};
                            else
                              e.partial = !(e.almost=!0);
                          }
                        }
                        donechange = [{e:e,x:sT,i}];
                      break;
                      case "CLRD":
                        if(rest){
                          if(/partial/i.exec(rest)){
                            if(!(!!e&&typeof e==="object") )
                              e = {partial:!0,almost:!1};
                            else
                              e.partial = !(e.almost=!1);
                          }else if(/almost/i.exec(rest)){
                            if(!(!!e&&typeof e==="object") )
                              e = {partial:!1,almost:!0};
                            else
                              e.partial = !(e.almost=!0);
                          }
                        }
                        let i_c = selectS.getIndexOfStatus("CL");
                        i_c = i_c===0?i_c:(i_c||-1);
                        let i_r = selectS.getIndexOfStatus("CL");
                        i_r = i_r===0?i_r:(i_r||-1);
                        donechange = [{x:"CL",i:i_c,e},
                                      {x:"RD",i:i_r,e}];
                      break;
                      case "RL":
                        if(!rest)
                          return show.error({msg:"DexID Not specified!", command:"done \\* **RL**"},msg.channel);
                        let RelMSG = await client.channels.fetch(Channels.release).then(async chn=>{
                          return await chn.send(`${NOMENTION?"":selectS.mention?`<@&${selectS.mention}> `:""}**${selectS.getName()} chapter ${selectC.id} released**\nOn MangaDex: https://mangadex.org/chapter/${rest.trim()}`);
                        });
                        if(!(!!e&&typeof e==="object"))
                          e = {msgID:RelMSG.id,dexid:`${rest.trim()}`};
                        else{
                          e.msgID=RelMSG.id;
                          e.dexid=rest.trim();
                        }
                        donechange = [{x:sT,i, e}];
                        let nc = selectS.chapters[selectS.chapters.indexOf(selectC)+1]
                        selectS.current = nc.id;
                        selectC.sDate = selectC.startDate;
                        selectC.startDate = null;
                        nc.startDate = nDate;
                      break;
                    }
                    if(donechange){
                      let changed = false;
                      donechange.forEach(dC=>{
                        if(parseInt(dC.i)>=0){
                          changed = true;
                          selectC.status[parseInt(dC.i)] = dC.e;
                        }
                      });
                      if(changed){
                        await SeriesData.save();
                        // console.log(show);
                        await show.last(msg.channel, {data:SeriesData.data,sdata:selectS,chdata:selectC});
                        msg.channel.send(new Discord.MessageEmbed()
                                          .setTitle(`Updated ${selectS.getName()}(#${selectS.id})`)
                                          .addField(`Done`, `${donechange.map((a,v)=>v=`${a.x} ${a.e?(a.e.partial?"partial":""):""}${a.e?a.e.almost?"almost":"":""}${a.e?(a.e.dexid||""):""}`).join(",")}`)
                        ).then(msg=>msg.delete({timeout:2500}));
                      }
                    }
                  }
                }
                if(Array.isArray(selectS)){
                  // ask for which series to use
                  let qEx,i = await show.reactionSeriesSelect(msg.channel, selectS).catch(x=>(qEx=x,-1));
                  if(i !== -1){
                    messageData.choose = {i,series:selectS.map((a,v)=>v=a.getName()).join(",")};
                    selectS = selectS[i];
                    await doneAccept();
                  }else 
                    messageData.choose = {ex:qEx,series:selectS.map((a,v)=>v=a.getName()).join(",")};
                }else{
                  await doneAccept();
                }
              }
            }else{
              // help
              show.help(msg.channel,2);
            }
          }else {
            show.error(
              {
                msg:`This is not how you use **done** command! Check \`done help\` for more info!`,
                command:`${msg.content.replace(/([\*~_`])/g,"\\$1")}`,
                timeout:5000
              },msg.channel);
          }
        break;
        case "revoke":
          // revoke *
          if(revokeresult = RGX.done.exec(msgresult[2].trim())){
            if(!revokeresult[1]){
              // selectedSeries, selectedChapter, selectedType, rest
              let sS = revokeresult[2], sC=revokeresult[3],sT=revokeresult[4],rest=revokeresult[5];
              let selectS = SeriesData.data.series.getSeries(sS);
              if(!selectS){
                show.error(
                  {
                    msg:`Could not find series **${sS}**`,
                    command:`revoke **~~${sS}~~**:${sC} ${sT}${rest}`,
                    timeout:2500
                  }
                  ,msg.channel);
              }else {
                let revokeAccept = async ()=>{
                  console.log("Revoke for series:", selectS.getName(), "chapter:", sC);
                  let sCodes = selectS.statusCodes || defSC;
                  let selectC = sC?selectS.chapters.get(sC):selectS.chapters.getCurrent();
                  if(!selectC){
                    // ERROR: Could not find chapter
                    show.error({msg:`Could not find chapter #${sC}`,command:`revoke ${selectS.getName()}:${sC||"<current>"}`},msg.channel);
                  }else{
                    // Found chapter
                    let revokechange = null;
                    let e = 0;
                    let i = selectS.getIndexOfStatus(sT);
                    i = i===0?0:(i||-1);
                    // TODO: change switch to regex
                    switch(sT.toUpperCase()){
                      case "TL":
                      case "PR":
                      case "CL":
                      case "RD":
                      case "TS":
                      case "QC":
                      case "CL":
                        revokechange = [{x:sT,i,e}];
                      break;
                      case "RL":
                      let RM = selectC.status[6].msgID;
                        if(RM)
                          client.channels.fetch(Channels.release)
                            .then(c=>{c.messages.fetch(RM)
                                .then(m=>m.delete()).catch(console.error);});
                        revokechange = [{x:sT,i,e}];
                        selectS.current = selectC.id;
                        selectC.startDate = selectC.sDate || nDate;
                      break;
                      case "CLRD":
                        let i_c = selectS.getIndexOfStatus("CL");
                        i_c = i_c===0?i_c:(i_c||-1);
                        let i_r = selectS.getIndexOfStatus("CL");
                        i_r = i_r===0?i_r:(i_r||-1);
                        revokechange = [{x:"CL",i:i_c,e},
                                      {x:"RD",i:i_r,e}];
                      break;
                    }
                    if(revokechange){
                      let changed = false;
                      revokechange.forEach(dC=>{
                        if(parseInt(dC.i)>=0){
                          changed = true;
                          selectC.status[parseInt(dC.i)] = dC.e;
                        }
                      });
                      if(changed){
                        await SeriesData.save();
                        await show.last(msg.channel, {data:SeriesData.data,sdata:selectS,chdata:selectC});
                        msg.channel.send(new Discord.MessageEmbed().setColor("#ff0000")
                                          .setTitle(`Updated ${selectS.getName()}(#${selectS.id})`)
                                          .addField(`Revoke`, `${revokechange.map((a,v)=>v=a.x).join(",")}`)
                        ).then(msg=>msg.delete({timeout:2500}));
                      }
                    }
                  }
                }
                if(Array.isArray(selectS)){
                  // ask for which series to use
                  let i = await show.reactionSeriesSelect(msg.channel, selectS).catch(_=>-1);
                  if(i !== -1){
                    messageData.choose = {i,series:selectS.map((a,v)=>v=a.getName()).join(",")};
                    selectS = selectS[i];
                    await revokeAccept();
                  }
                }else{
                  await revokeAccept();
                }
              }
            }else{
              // help
              show.help(msg.channel,3);
            }
          }else {
            show.error(
              {
                msg:`This is not how you use **revoke** command! Check \`revoke help\` for more info!`,
                command:`${msg.content.replace(/([\*~_`])/g.replace("\\$1"))}`,
                timeout:5000
              },msg.channel);
          }
        break;
        case "new":
          // new *
        break;
        case "change":
          // change *
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
      await show.log(Channels.botlog, messageData, client);
    }
  }
}

// discord.js event handler
client.on('message', onmessage);
client.on('messageReactionAdd', onreaction);