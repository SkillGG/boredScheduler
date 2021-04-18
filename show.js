const Discord = require("discord.js");
const {getDeadline, getNextDayOfWeek,getDayOfWeekAfterWeeks,dow,gdt,NO_DEADLINE} = require("./datefn.js");
// Embed Fields
let newf = (n,v,f)=>{let x={name:n||"",value:v||""};if(f!==undefined)x.inline=f;return x;}
let newbf = f=>newf("\u200b","\u200b",f);

let debug = ()=>{
  console.log(ReactionData,embeds.map(e=>({id:e.id, text:e.content, embed: e.embeds[0].title})));
}

const PARTIAL = "__We're half way!__";
const ALMOST = "__We're almost there!__";
const DONE = ":o:";
const DEADLINE_after = ":x:\n**~~Deadline: $date~~**";
const DEADLINE_before = ":x:\nDeadline: $date";

let error = (o,channel)=>{
  if(!channel) return console.error("chapter not specified!");
  let e = new Discord.MessageEmbed()
  .setTitle("Error").setColor("#ff0000")
  .addField("Message",`${o.msg||"Undefined error"}`)
  .addField(`Command`, `${o.command||"======="}`);
  channel.send(e).then(e=>e.delete({timeout: o.timeout || 2000}));
}

const defSC = ["TL","PR","CL","RD","TS","QC","RL"];
const defReact = ["🇦", "🇧","🇨","🇩","🇪","🇫","🇬","🇭","🇮","🇯","🇰","🇱","🇲"];

let embeds = [];
let clearEmbeds = async ()=>{
  for (let i = embeds.length - 1; i >= 0; i--){
    if(!embeds[i].deleted){
      console.log("Clearing embed " + i, embeds[i].id);
      await embeds[i].delete().catch(console.error);
    }
  }
  if(ReactionData.messageID && ReactionData.channelID)
    client.channels.fetch(ReactionData.channelID).then(ch=>ch.messages.fetch(ReactionData.messageID).then(m=>m.delete()));
  embeds = [];
}


let logMessage = async (channel,msgData, client)=>{
  if(!msgData.log || !channel)
    return;
  if(typeof channel === "string" || channel instanceof String){
    // channel string
    if(!client) return;
    channel = await client.channels.fetch(channel);
  }
  logMsg = `Bot activity by ${msgData.user}!
Command:
>   *__${msgData.content}__*`;
  if(msgData.choose){
    console.log(msgData.choose);
    logMsg += `\n${msgData.user} chose: ${msgData.choose.series.split(",")[msgData.choose.i]}
Possible choices: ${msgData.choose.series.replace(",",", ")}`;
  }
  channel.send(logMsg);
}

let help = async (channel, command)=>{
  if(!channel) return console.error("channel not specified!");
  await clearEmbeds();
  if(!command) command=1;
  let newEmbed = new Discord.MessageEmbed();
  switch(parseInt(command)){
    case 1:
      // show
      newEmbed.setTitle("Help for `show`")
      .addField("General syntax:", "`show [help] <option>[ <number>[:<number>]]`")
      .addField("option:", `\`all\` - show all except ceased series
\`ceased\` - show all with ceased series
\`series <seriesID>[:<start:0=current>]\` - get chapter before, after and with id equal to "start"
\`chapter <seriesID>:<cnum>\` - get chapter #<chnum> from series <series>`)
      .addField("Examples:",`\`\`\`
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
/(TL|PR|CLRD|CL|RD|TS|QC|RL)/\`\`\``,true)
      .addField("add:", "Additional info",true)
      .addField("CL/RD/CLRD <add>:", ` \`\`\`js
partial // the work has been partially done (you can start TS)\`\`\` `)
      .addField("RL <add>:", ` \`\`\`js
Number(/\\d+/) // mangaDex chapterID \`\`\` `)
      .addField("Examples:",`\`\`\`js
done 1:12 TS // done TS for Denjin N 12
done denjin N 15 TL // done TL for Denjin N 15
done hiro CL partial // done CL for Heroine wa... partially
done ope 4 RL 114189 // released OpeKan 4 on MangaDex (dexid: 114189)
done den RL 1111111 // released current chapter of Denjin N (dexid:1111111)\`\`\``)
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
/(TL|PR|CLRD|CL|RD|TS|QC|RL)/\`\`\``,true)
      .addField("Examples:",`\`\`\`js
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
      .addField("~~cease~~", "TODO (not yet implemented)")
      break;
  }
  channel.send(newEmbed).then(e=>embeds.push(e));
}

let ReactionData = {locked:!0};

let showReactionSeriesSelect = (channel, series, custom)=>{
  if(!channel) return console.error("Channel not specified!");
  if(!(series instanceof Array)) return null;
  if(custom && !(custom instanceof Array)) custom = null;
  return new Promise(async (s,q)=>{
    let reactionTable = custom||defReact;
    reactionTable.splice(series.length);
    let Embed = new Discord.MessageEmbed().setTitle("Found multiple titles!");
    series.forEach((e,i)=>{
      Embed
      .addField(`${e.getName()} (${e.id})`,`${reactionTable[i]}`, !0)
    });
    await channel.send(Embed).then(async message=>{
      console.log(message.id);
      series.forEach((e,i)=>{
        message.react(reactionTable[i]);
      });
      message.react("❌");
      ReactionData.locked = false;
      ReactionData.messageID = message.id;
      ReactionData.channelID = message.channel.id;
      let index = null;
      let gotReaction =
      await new Promise(async (ss,qq)=>{
        let interval = 
        setInterval(_=>{
          if(ReactionData.response){
            if((index=reactionTable.indexOf(ReactionData.response._emoji.name)) !== -1){
              clearInterval(interval);
              ss(ReactionData.response);
            }else {
              if(ReactionData.response._emoji.name === "❌"){
                ss("cancel");
              }else{
                error({msg:"Wrong reaction!",command:`${ReactionData.response.emoji.name}`}, channel);
                ReactionData.response.remove();
                ReactionData.response = null;
              }
            }
          }
        },1);
      });
      ReactionData.response = null;
      ReactionData.messageID = null;
      ReactionData.channelID = null;
      message.delete();
      console.log(ReactionData);
      if(gotReaction === "cancel")
        q("User canceled");
      if(index || index === 0)
        s(index);
      else
        q("Couldn't find emoji in the list!");
    });
  });
}

let LASTDATA = null;

let showLast = async (channel, data)=>{
  console.log("showing last!");
  if(!LASTDATA){
    console.log("no LASTDATA!");
    ret=await showAllData(data.data, channel,data.ceased);
  }else {
    switch(LASTDATA.t){
      case 0:
        ret=await showAllData(data.data||LASTDATA.data, channel, data.ceased||LASTDATA.ceased);
      break;
      case 1:
        ret=await showChapterData(data.sdata||LASTDATA.sdata, data.chdata||LASTDATA.chdata, channel);
      break;
      case 2:
        ret=await showSeriesData(data.sdata||LASTDATA.sdata, channel, data.start||LASTDATA.start);
      break;
    }
  }
}

let showAllData = async (data, channel, ceased)=>{
  if(!channel) return console.error("chapter not specified!");
  if(!data) return console.error("Data not specified!");
  console.log("Showing all!");
  LASTDATA = {ch:channel,t:0,data,ceased};
  //console.log("data",data);
  await clearEmbeds();
  data.series.forEach((e,i,a)=>{
    if(!ceased && e.ceased) return;
    let newEmbed = new Discord.MessageEmbed().setTitle(`${e.getName()}`).setColor("#0000ff");
    let scodes = e.statusCodes||defSC;
    let curch = e.chapters.getCurrent();
    if(curch){
      let sDate = new Date(curch.startDate);
      newEmbed.fields.push(newf(`${e.getName()}(#${e.id})`, `${curch.volume?`Vol.${curch.volume}`:""} Ch.${curch.id} ${curch.name?`**"${curch.name}"**`:""}`,false));
      newEmbed.fields.push(newf(`Start date`, gdt(sDate, true)));
      sDate.setDate(sDate.getDate()+1);
      if(curch.late)
        sDate.setDate(sDate.getDate()-(parseInt(curch.late)||0));
      curch.status.forEach((x,z)=>{
        let Deadline = getDeadline((e.schedule||{dows:[]}).dows[z],curch.weekSkip||false,sDate);
        let DeadText, DoneText = DONE;
        if(Deadline.text!=NO_DEADLINE && Deadline.date-(new Date()) < 0)
          DeadText = DEADLINE_after.replace("$date", `${Deadline.text}`);
        else
          DeadText = DEADLINE_before.replace("$date",`${Deadline.text}`);
        if(!!x&&typeof x==="object"){
          // TODO: get done properties
          switch(scodes[z].toLowerCase()){
            case "cl":
            case "rd":
              if(x.almost||x.partial){
                DoneText = `${x.almost?ALMOST:x.partial?PARTIAL:"huh?"}\n${DeadText}`;
              }
            break;
            case "rl":
              if(x.dexid)
                DoneText = `Released on [MangaDex](https://mangadex.org/chapter/${x.dexid})`;
            break;
          }
        }
        newEmbed.fields.push(newf(`${scodes[z]}:`,`${x?DoneText:DeadText}`, true));
      });
      newEmbed.setFooter(`chapter\u200b${e.id}:${curch.id}${"\u3000".repeat(125)}.`)
    }
    channel.send(newEmbed).then(m=>{embeds.push(m);})
  });
}
let showChapterData = async (sdata, chdata, channel)=>{
  if(!channel) return console.error("chapter not specified!");
  if(!sdata || !chdata) return console.error("data not specified!");
  LASTDATA = {ch:channel,t:1,sdata,chdata};
  console.log("Showing chapter");
  await clearEmbeds();
  let newembed =
    new Discord.MessageEmbed()
    .setTitle(`${sdata.getName()} ${chdata.volume?`Vol.${chdata.volume} `:``}Ch.${chdata.id}`).setColor("#0000ff")
    .setFooter(`chapter ${sdata.id}:${chdata.id}`);
  let scodes = sdata.statusCodes||defSC;
  let sDate;
  if(chdata.startDate){
    sDate = new Date(chdata.startDate);
    sDate.setDate(sDate.getDate()+1);
  } else{
    sDate = new Date(chdata.sDate||-1);
  }
  console.log(chdata, sDate)
  if(sDate >= 0 && chdata.late)
    sDate.setDate(sDate.getDate()- (parseInt(chdata.late)||0));
  if(sDate < 0)
    sDate = -1;
  chdata.status.forEach((st,i)=>{
    console.log(chdata.startDate, sDate);
      let Deadline = getDeadline((sdata.schedule||{dows:[]}).dows[i],chdata.weekSkip||false,sDate);
      let DeadText, DoneText = DONE;
      if(Deadline.text!=NO_DEADLINE && Deadline.date-(new Date()) < 0)
        DeadText = DEAD_after.replace()
      else
        DeadText = `Deadline: ${Deadline.text}`;
      if(!!st&&typeof st==="object"){
        switch(scodes[i].toLowerCase()){
          case "cl":
          case "rd":
            if(st.partial){
              DoneText = `${PARTIAL}\n${DeadText}`;
            }
          break;
          case "rl":
            DoneText = "";
            if(st.dexid){
              if(typeof st.dexid === "string")
                DoneText = `Released on [MangaDex](https://mangadex.org/chapter/${st.dexid})`;
              else
                DoneText = `Released on [MangaDex](https://mangadex.org/chapter/${st.dexid.id}) by ${st.dexid.by}`
            }
            else 
              DoneText = DONE;
          break;
        }
      }
      newembed.fields.push(newf(scodes[i],`${st?DoneText:DeadText}`,true));
  });
  channel.send(newembed).then(x=>embeds.push(x));
} 
let showSeriesData = async (sdata,channel, start)=>{
  if(!channel) return console.error("chapter not specified!");
  if(!sdata) return console.error("Data not specified!");
  if(!start && `${start}`!== "0") return console.error("Start not defined!");
  if(!parseFloat(start) && `${start}`!== "0") return console.error("Start is not a number!");
  start = parseFloat(start);
  if(start === 0)
    start = parseFloat(sdata.chapters.getCurrent().id)-parseInt(sdata.parent.showVal/2);
  end= start+sdata.parent.showVal;
  LASTDATA = {ch:channel,t:2,sdata,start};
  console.log("Showing series");
  await clearEmbeds();
  let embedAll = [
    
  ];
  channel.send(
    new Discord.MessageEmbed().setTitle(`${sdata.getName()}(#${sdata.id}) ${(sdata.ceased?"~~Ceased~~":"On-going")}`)
    .addField(`Chapters:`,` ${start}-${end}`,true).setFooter(`series\u200b${sdata.id}${"\u3000".repeat(125)}.`).setColor("#0000ff")
  ).then(m=>{embeds.push(m);})
  let scodes = sdata.statusCodes||defSC;
  sdata.chapters.forEach((e,chi,cha)=>{
    if(parseInt(e.id) < parseInt(start) || parseInt(e.id) > parseInt(end)) return;
    console.log("Show chapter: " + e.id, e.startDate);
    let sDate;
    if(e.startDate){
       sDate = new Date(e.startDate);
      sDate.setDate(sDate.getDate()+1);
    } else{
      sDate = new Date(e.sDate||-1);
    }
    if(sDate > 0 && e.late)
      sDate.setDate(sDate.getDate()-(parseInt(e.late)||0));
    if(sDate < 0)
      sDate = -1;
    let chapterEmbed = new Discord.MessageEmbed().setTitle(`${e.volume?`Vol.${e.volume} `:""}Ch.${e.id}`).setColor("#0000ff");
    chapterEmbed.fields.push(newf(`Name`,`${e.name?e.name:"------"}`,false));
    chapterEmbed.fields.push(newf(`Progress`, `${e.status.reduce((a,v)=>a+(!!v))}/${e.status.length}`));
    e.status.forEach((st,i)=>{
      console.log(sDate);
      let Deadline = getDeadline((sdata.schedule||{dows:[]}).dows[i],e.weekSkip||false,sDate);
      let DeadText, DoneText = DONE;
      if(Deadline.text!=NO_DEADLINE && Deadline.date-(new Date()) < 0)
        DeadText = `**~~Deadline: ${Deadline.text}~~**`
      else
        DeadText = `Deadline: ${Deadline.text}`;
      if(!!st&&typeof st==="object"){
        switch(scodes[i].toLowerCase()){
          case "cl":
          case "rd":
            if(st.partial){
              DoneText = `${PARTIAL}\n${DeadText}`;
            }
          break;
          case "rl":
            DoneText = "";
            if(st.dexid || st.dexids){
              if(st.dexids){
                DoneText = `Released on MangaDex by `;
                st.dexids.forEach(e=>{
                  if(e.by !== null)
                    DoneText += `[${e.by}](https://mangadex.org/chapter/${e.id}) / `;
                  else
                    DoneText += `**[US](https://mangadex.org/chapter/${e.id})**\nor\n`;
                });
                DoneText = DoneText.slice(0,-3);
              }else{ 
                if(typeof st.dexid === "string")
                  DoneText = `Released on [MangaDex](https://mangadex.org/chapter/${st.dexid})`;
                else
                  DoneText = `Released on [MangaDex](https://mangadex.org/chapter/${st.dexid.id}) by ${st.dexid.by}`
              }
            }
            else 
              DoneText = DONE;
          break;
        }
      }
      chapterEmbed.fields.push(newf(scodes[i],`${st?DoneText:DeadText}`,true));
    });
    chapterEmbed.setFooter(`chapter\u200b${sdata.id}:${e.id}${"\u3000".repeat(125)}.`)
    channel.send(chapterEmbed).then(m=>{embeds.push(m);})
  });}

module.exports.show = {
  help,error,debug,
  last:showLast,
  log:logMessage,
  all:showAllData,
  chapter:showChapterData,
  series:showSeriesData,
  reactionSeriesSelect:showReactionSeriesSelect,
  ReactionData,
  clear:clearEmbeds
};
module.exports.newf = newf;
module.exports.newbf = newbf;
module.exports.defSC = defSC;