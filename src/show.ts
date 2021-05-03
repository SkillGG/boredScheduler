import {
	NO_DEADLINE,
	defaultReactions, defaultStatusCodes,
	PARTIAL, ALMOST,
	DEADLINE_after, DEADLINE_before,
	DONE,
	cancelReaction,
	DexChapterLink as MangaDexChapterLink,
	CubariChapterLink
} from "./strings";

import Discord = require("discord.js");
import { getDeadline, getUTCDate } from "./datefn";
import { discordClient, isTextChannel } from "./DiscordIDs";
import { BreakableStatus, Chapter, DatabaseSeriesData, DexID, getFloatFromSN, getIntFromSN, isBreakableStatus, isCubariRelease, isDexRelease, MultiDex, Series } from "./series";
// Embed Fields
let newField = (n: string, v: string, f?: boolean): Discord.EmbedField => { return { name: n || "", value: v || "", inline: f } };
// let newEmptyField = f => newField("\u200b", "\u200b", f);

function debug(): void {
	console.log("Debug: ", ReactionData, embeds.map(e => ({ id: e.id, text: e.content, embed: e.embeds[0].title })));
}

type ErrorMessage = {
	msg?: string,
	command?: string,
	timeout?: number
}

let error = (o: ErrorMessage, channel: Discord.Channel) => {
	if (!channel) return console.error("chapter not specified!");
	if (isTextChannel(channel)) {
		let e = new Discord.MessageEmbed()
			.setTitle("Error").setColor("#ff0000")
			.addField("Message", `${o.msg || "Undefined error"}`)
			.addField(`Command`, `${o.command || "======="}`);
		channel.send(e).then(e => e.delete({ timeout: o.timeout || 2000 }));
	}
}

let embeds: Discord.Message[] = [];

let clearEmbeds = async (): Promise<void> => {
	for (let i = embeds.length - 1; i >= 0; i--) {
		if (!embeds[i].deleted) {
			console.log("Clearing embed " + i, embeds[i].id);
			await embeds[i].delete().catch(console.error);
		}
	}
	if (ReactionData.messageID && ReactionData.messageID)
		discordClient.channels.fetch(ReactionData.channelID).then(ch =>
			isTextChannel(ch) && (ch.messages.fetch(ReactionData.messageID).then(m => m.delete()))
		);
	embeds = [];
}

interface Choosing {
	series: string;
	i: number;
}

interface MSGData {
	content: string;
	user: Discord.User;
	log: boolean;
	choose?: Choosing;
}

let logMessage = async (channel: Discord.Channel | string, msgData: MSGData): Promise<void> => {
	if (!msgData.log || !channel)
		return;
	if (typeof channel === "string") {
		// channel string
		if (!discordClient) return;
		channel = await discordClient.channels.fetch(channel);
	}
	if (!isTextChannel(channel)) return;
	let logMsg = `Bot activity by ${msgData.user}!
Command:
>   *__${msgData.content}__*`;
	if (msgData.choose) {
		console.log("Choice: ", msgData.choose);
		logMsg += `\n${msgData.user} chose: ${msgData.choose.series.split(",")[msgData.choose.i]}
Possible choices: ${msgData.choose.series.replace(",", ", ")}`;
	}
	channel.send(logMsg);
}

let help = async (channel: Discord.Channel, command: number): Promise<void> => {
	if (!channel || !isTextChannel(channel)) return console.error("channel not specified!");
	await clearEmbeds();
	if (!command) command = 1;
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
				.addField("~~cease~~", "TODO (not yet implemented)")
			break;
	}
	channel.send(newEmbed).then(e => embeds.push(e));
}

interface ReactionIDs {
	locked: boolean
	response: Discord.MessageReaction
	messageID?: string
	channelID?: string
}

let ReactionData: ReactionIDs = { locked: !0, response: null };

let showReactionSeriesSelect = (channel: Discord.Channel, series: Series[], custom?: string[]): Promise<number> => {
	if (!channel || !isTextChannel(channel)) return console.error("Channel not specified!"), null;
	return new Promise(async (s, q) => {
		let reactionTable = custom || defaultReactions;
		reactionTable.splice(series.length);
		let Embed = new Discord.MessageEmbed().setTitle("Found multiple titles!");
		series.forEach((e, i) => {
			Embed
				.addField(`${e.getName()} (${e.id})`, `${reactionTable[i]}`, !0)
		});
		await channel.send(Embed).then(async message => {
			console.log("messageID", message.id);
			series.forEach((_e, i) => {
				message.react(reactionTable[i]);
			});
			message.react(cancelReaction);
			ReactionData.locked = false;
			ReactionData.messageID = message.id;
			ReactionData.channelID = message.channel.id;
			let index: number;
			let gotReaction =
				await new Promise<string>(async (ss, qq) => {
					let interval =
						setInterval(_ => {
							if (ReactionData.response) {
								if ((index = reactionTable.indexOf(ReactionData.response.emoji.name)) !== -1) {
									clearInterval(interval);
									ss("good");
								} else {
									if (ReactionData.response.emoji.name === "❌") {
										ss("cancel");
									} else {
										error({ msg: "Wrong reaction!", command: `${ReactionData.response.emoji.name}` }, channel);
										ReactionData.response.remove();
										ReactionData.response = null;
									}
								}
							}
						}, 1);
				});
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
		});
	});
}

interface LoadLastData {
	sdata?: Series
	chdata?: Chapter
	data?: DatabaseSeriesData
	ceased?: boolean
	start?: number
}

interface LastShowData extends LoadLastData {
	t: number
}

let LASTDATA: LastShowData = null;

let showLast = async (channel: Discord.Channel, data?: LoadLastData) => {
	console.log("showing last!");
	if (!LASTDATA) {
		console.log("no LASTDATA!");
		if (!data) return;
		await showAllData(data.data, channel, data.ceased);
	} else {
		switch (LASTDATA.t) {
			case 0:
				await showAllData(data.data || LASTDATA.data, channel, data.ceased || LASTDATA.ceased);
				break;
			case 1:
				await showChapterData(data.sdata || LASTDATA.sdata, data.chdata || LASTDATA.chdata, channel);
				break;
			case 2:
				await showSeriesData(data.sdata || LASTDATA.sdata, channel, data.start || LASTDATA.start);
				break;
		}
	}
}

let DexArrayDoneText = (st: MultiDex): string => {
	return `Released on ${st.reduce<string>((a, v, i2): string => {
		if (typeof v == "string")
			return a + `${i2 ? "\n" : ""}[MangaDex](${MangaDexChapterLink}${v})`
		if (v.by !== null)
			return a + ` ${i2 ? "or\n " : ""} [MangaDex] by ${v.by}(${MangaDexChapterLink}${v.id})`;
		else
			return a + `${i2 ? " or\n" : ""}[MangaDex] by **[US](${MangaDexChapterLink}${v.id})**`;
	}, "")}`;
}

let getCLRDTSAlmostPartialInfo = (st: BreakableStatus, dt: string): string => {
	if (st.almost || st.partial)
		return `${st.almost ? ALMOST : st.partial ? PARTIAL : "huh?"}\n${dt}`;
	return "";
}

let showAllData = async (data: DatabaseSeriesData, channel: Discord.Channel, ceased?: boolean) => {
	if (!channel || !isTextChannel(channel)) return console.error("chapter not specified!");
	if (!data) return console.error("Data not specified!");
	console.log("Showing all!");
	LASTDATA = { t: 0, data: data, ceased };
	//console.log("data",data);
	await clearEmbeds();
	data.series.forEach((e, _i) => {
		if (!ceased && e.ceased) return;
		let newEmbed = new Discord.MessageEmbed().setTitle(`${e.getName()}`).setColor("#0000ff");
		let scodes = e.statusCodes || defaultStatusCodes;
		let curch = e.chapters.getCurrent();
		if (curch) {
			let sDate = new Date(curch.startDate);
			newEmbed.fields.push(newField(`${e.getName()}(#${e.id})`, `${curch.volume ? `Vol.${curch.volume}` : ""} Ch.${curch.id} ${curch.name ? `**"${curch.name}"**` : ""}`, false));
			newEmbed.fields.push(newField(`Start date`, getUTCDate(sDate, true)));
			sDate.setDate(sDate.getDate() + 1);
			if (curch.late)
				sDate.setDate(sDate.getDate() - (curch.late || 0));
			curch.status.forEach((x, z) => {
				let Deadline = getDeadline((e.schedule || { dows: [] }).dows[z], sDate, curch.weekSkip || null);
				let DeadText, DoneText = DONE;
				if (Deadline.text != NO_DEADLINE && Deadline.date.getTime() - (new Date().getTime()) < 0)
					DeadText = DEADLINE_after.replace("$date", `${Deadline.text}`);
				else
					DeadText = DEADLINE_before.replace("$date", `${Deadline.text}`);
				if (!!x && typeof x === "object") {
					// TODO: more done properties
					switch (scodes[z].toLowerCase()) {
						case "cl":
						case "rd":
						case "ts":
							if (!isBreakableStatus(x)) break;
							DoneText = getCLRDTSAlmostPartialInfo(x, DeadText);
							break;
						case "rl":
							if (isBreakableStatus(x)) break;
							if (isDexRelease(x)) {
								if (typeof x.dexid === "string") {
									DoneText = `Released on [MangaDex](${MangaDexChapterLink}${x.dexid})`;
									break;
								} else if (!Array.isArray(x.dexid)) {
									DoneText = `Released on [MangaDex](${MangaDexChapterLink}${x.dexid.id}) by ${x.dexid.by}`;
									break;
								} else {
									DoneText = DexArrayDoneText(x.dexid);
									break;
								}
							}
							if (isCubariRelease(x)) {
								DoneText = `Released on [Cubari](${CubariChapterLink}${x.cubari})`;
								break;
							}
							DoneText = `Released on [${x.name}](${x.link})`;
							break;
					}
				}
				newEmbed.fields.push(newField(`${scodes[z]}:`, `${x ? DoneText : DeadText}`, true));
			});
			newEmbed.setFooter(`chapter\u200b${e.id}:${curch.id}${"\u3000".repeat(125)}.`)
		}
		channel.send(newEmbed).then(m => { embeds.push(m); })
	});
}

let showChapterData = async (sdata: Series, chdata: Chapter, channel: Discord.Channel) => {
	if (!channel || !isTextChannel(channel)) return console.error("channel not specified!");
	if (!sdata || !chdata) return console.error("data not specified!");
	LASTDATA = { t: 1, sdata, chdata };
	console.log("Showing chapter");
	await clearEmbeds();
	let newembed =
		new Discord.MessageEmbed()
			.setTitle(`${sdata.getName()} ${chdata.volume ? `Vol.${chdata.volume} ` : ``}Ch.${chdata.id} ${chdata.name||""}`).setColor("#0000ff")
			.setFooter(`chapter ${sdata.id}:${chdata.id}`);
	let scodes = sdata.statusCodes || defaultStatusCodes;
	let sDate: Date;
	if (chdata.startDate) {
		sDate = new Date(chdata.startDate);
		sDate.setDate(sDate.getDate() + 1);
	} else {
		sDate = new Date(chdata.sDate || -1);
	}
	console.log("chData: ", chdata, "sDate:", sDate)
	if (sDate.getTime() >= 0 && chdata.late)
		sDate.setDate(sDate.getDate() - chdata.late);
	if (sDate.getTime() < 0)
		sDate = null;
	chdata.status.forEach((st, i) => {
		let Deadline = getDeadline((sdata.schedule || { dows: [] }).dows[i], sDate, chdata.weekSkip);
		let DeadText: string, DoneText = DONE;
		if (Deadline.text != NO_DEADLINE && Deadline.date.getTime() - (new Date().getTime()) < 0)
			DeadText = DEADLINE_after.replace("$date", Deadline.text);
		else
			DeadText = `Deadline: ${Deadline.text}`;
		if (!!st && typeof st === "object") {
			switch (scodes[i].toLowerCase()) {
				case "cl":
				case "rd":
				case "ts":
					if (!isBreakableStatus(st)) break;
					DoneText = getCLRDTSAlmostPartialInfo(st, DeadText);
					break;
				case "rl":
					if (isBreakableStatus(st)) break;
					if (isDexRelease(st)) {
						if (typeof st.dexid === "string")
							DoneText = `Released on [MangaDex](${MangaDexChapterLink}${st.dexid})`;
						else if (!Array.isArray(st.dexid))
							DoneText = `Released on [MangaDex](${MangaDexChapterLink}${st.dexid.id}) by ${st.dexid.by}`;
						else
							DoneText = DexArrayDoneText(st.dexid);
						break;
					}
					if (isCubariRelease(st)) {
						DoneText = `Released on [Cubari](${CubariChapterLink}${st.cubari})`
						break;
					}
					DoneText = `Released on [${st.name}](${st.link})`;
					break;
			}
		}
		newembed.fields.push(newField(scodes[i], `${st ? DoneText : DeadText}`, true));
	});
	channel.send(newembed).then(x => embeds.push(x));
}

let showSeriesData = async (sdata: Series, channel: Discord.Channel, start: string | number) => {
	if (!channel || !isTextChannel(channel)) return console.error("chapter not specified!");
	if (!sdata) return console.error("Data not specified!");
	if (!start && `${start}` !== "0") return console.error("Start not defined!");
	if (typeof start === "string" && !parseFloat(start) && `${start}` !== "0.0") return console.error("Start is not a number!");
	start = getFloatFromSN(start);
	if (start === 0)
		start = parseFloat(sdata.chapters.getCurrent().id) - Math.floor(sdata.parent.showVal / 2);
	let end = start + sdata.parent.showVal;
	LASTDATA = { t: 2, sdata, start };
	console.log("Showing series");
	await clearEmbeds();
	channel.send(
		new Discord.MessageEmbed().setTitle(`${sdata.getName()}(#${sdata.id}) ${(sdata.ceased ? "~~Ceased~~" : "On-going")}`)
			.addField(`Chapters:`, ` ${start}-${end}`, true).setFooter(`series\u200b${sdata.id}${"\u3000".repeat(125)}.`).setColor("#0000ff")
	).then(m => { embeds.push(m); })
	let scodes = sdata.statusCodes || defaultStatusCodes;
	sdata.chapters.forEach((chapter, chi, cha) => {
		if (parseInt(chapter.id) < getIntFromSN(start) || parseInt(chapter.id) > end) return;
		console.log("Show chapter: " + chapter.id, chapter.startDate);
		let sDate: Date;
		if (chapter.startDate) {
			sDate = new Date(chapter.startDate);
			sDate.setDate(sDate.getDate() + 1);
		} else {
			sDate = new Date(chapter.sDate || -1);
		}
		if (sDate.getTime() > 0 && chapter.late)
			sDate.setDate(sDate.getDate() - chapter.late);
		if (sDate.getTime() < 0)
			sDate = new Date(-1);
		let chapterEmbed = new Discord.MessageEmbed().setTitle(`${chapter.volume ? `Vol.${chapter.volume} ` : ""}Ch.${chapter.id}`).setColor("#0000ff");
		chapterEmbed.fields.push(newField(`Name`, `${chapter.name ? chapter.name : "------"}`, false));
		chapterEmbed.fields.push(newField(`Progress`, `${chapter.status.reduce<number>((a, v) => a + +(!!v), 0)}/${chapter.status.length}`));
		chapter.status.forEach((st, i) => {
			console.log("sDate:", sDate);
			let Deadline = getDeadline((sdata.schedule || { dows: [] }).dows[i], sDate, chapter.weekSkip);
			let DeadText, DoneText = DONE;
			if (Deadline.text != NO_DEADLINE && Deadline.date.getTime() - (new Date().getTime()) < 0)
				DeadText = `**~~Deadline: ${Deadline.text}~~**`
			else
				DeadText = `Deadline: ${Deadline.text}`;
			if (!!st && typeof st === "object") {
				switch (scodes[i].toLowerCase()) {
					case "cl":
					case "rd":
					case "ts":
						if (!isBreakableStatus(st)) break;
						DoneText = getCLRDTSAlmostPartialInfo(st, DeadText);
						break;
					case "rl":
						if (isBreakableStatus(st)) break;
						if (isDexRelease(st)) {
							if (typeof st.dexid === "string")
								DoneText = `Released on [MangaDex](${MangaDexChapterLink}${st.dexid})`;
							else if (!Array.isArray(st.dexid))
								DoneText = `Released on [MangaDex](${MangaDexChapterLink}${st.dexid.id}) by ${st.dexid.by}`;
							else
								DoneText = DexArrayDoneText(st.dexid);
							break;
						}
						if (isCubariRelease(st)) {
							DoneText = `Released on [Cubari](${CubariChapterLink}${st.cubari})`
							break;
						}
						DoneText = `Released on [${st.name}](${st.link})`;
						break;
				}
			}
			chapterEmbed.fields.push(newField(scodes[i], `${st ? DoneText : DeadText}`, true));
		});
		chapterEmbed.setFooter(`chapter\u200b${sdata.id}:${chapter.id}${"\u3000".repeat(125)}.`)
		channel.send(chapterEmbed).then(m => { embeds.push(m); })
	});
}

export let show = {
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
export let newf = newField;