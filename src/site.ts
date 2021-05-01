import http = require("http");
import {
	Series, Chapter,
	CLRDTSStatus, ChapterStatus, ReleaseStatus,
	DatabaseSeriesData
} from "./series";
import { siteHost } from "./strings";
import "./extends";

let checkIfSiteIsUp = (): Promise<string> => {
	return new Promise((r, q) => {
		const req = http.request(
			{
				hostname: siteHost,
				port: 80,
				path: '/Series/info.php',
				method: 'GET'
			},
			(res) => res.on('data', chunk => r(`${chunk}`))
		);
		req.on('error', (e) => q(`Problem with request: ${e.message}`));
		// Write data to request body
		req.end();
	});
}

let sendDataToServer = (data: SiteData) => {
	return new Promise((r, q) => {
		const req =
			http.request(
				{
					hostname: siteHost,
					port: 80,
					path: "/update.php",
					method: "POST",
					headers: {
						'Content-Type': "application/json"
					}
				},
				(res) => {
					res.on("data", (data) => {
						if (`${data}`.charAt(0) === "0") {
							r("Succesfully updated!\n" + `\n===\n\n${data}\n\n====`);
						} else {
							q("Something went wrong!\n" + `\n====\n\n${data}\n\n====`);
						}
					});
				}
			);
		req.write(JSON.stringify(data));
		req.end();
	});
}

let send = (data: SiteData) => {
	checkIfSiteIsUp()
		.then(_ => {
			sendDataToServer(data)
				.then(d=>console.log("Send to server", d))
				.catch(e=>console.error("Error: ", e));
		})
		.catch(console.error);
}

type SiteData = {
	pass: string,
	pathName?: string,
	html?: string,
	volume?: string
}

type ChapterNRStatus = [number, number, CLRDTSStatus, CLRDTSStatus, CLRDTSStatus, number];

let updateSeries = (series: Series) => {
	if (!series.siteName)
		return "no siteName";

	let data: SiteData = { pass: process.env.SitePASS };
	data.pathName = series.siteName;
	data.html = ``;
	let redos = 0;

	type ChapterStatusLiteral = {
		released: string,
		info: string,
		status: ChapterStatus
	}

	let getLastVolume = (): string => {
		let lv = -1;
		series.chapters.forEach(e => {
			if (parseInt(e.volume) > lv)
				lv = parseInt(e.volume);
		});
		console.log("Found last volume of ", series.name, lv, series.chapters);
		return `${lv}`;
	}

	let getLastDoneVolume = () => {
		let r = null;
		let n = parseInt(getLastVolume());
		while (!r) {
			if (n == -1)
				return null;
			if (series.chapters.filter(c => (+c.volume == n) && (c.status.reduce<number>((a, b) => (a + +!!b), 0) > 1)))
				r = n;
			n--;
		}
		return r;
	}

	function* nextVolume(s: Series): Generator<Chapter[], undefined, void> {
		let x = 0;
		let lv = parseInt(getLastVolume());
		if (lv === -1) {
			yield s.chapters;
			return;
		}
		while (x < lv) {
			x++;
			yield s.chapters.filter(c => +c.volume == x);
		}
		return;
	}

	let getMissingsAndLvl = (status: Array<number | CLRDTSStatus>) => {
		const missStr = ["missedTL", "missedPR", "missedCL", "missedRD", "missedTS", ""];
		let lvl = 0;
		let miss: string = status.reduce<string>((p, c, i) => {
			if (p)
				lvl = i + 1;
			if (lvl > 2)
				lvl--;
			if (!c)
				if (missStr[i])
					return p + ` ${missStr[i]}='true'`;
			return p;
		}, "");
		return { lastVolume: lvl, missings: miss };
	}

	// get status of 0-stated series
	let getUndoneStatus = (status: ChapterNRStatus, chapter: Chapter | ChapterStatusLiteral): string => {
		let { missings, lastVolume } = getMissingsAndLvl(status);
		//console.log(`Chapter ${chapter.id} lvl: ${lvl}`, chapter.status);
		if (lastVolume > 0)
			return `status="3" s3="${lastVolume}"${missings}`;
		return `status="${chapter.released ? "2" : "1"}"${chapter.info ? ` sstat=${chapter.info}` : ""}`;
	}

	type DoneStatus = {
		redoDOMChapter: string | DoneStatus,
		firstDOMChapter: string
	}

	// get status of Done series
	let getDoneStatus = (status: ChapterNRStatus, donestatus: ReleaseStatus, chapter: Chapter | ChapterStatusLiteral): string | DoneStatus => {
		if (donestatus.dexid) {
			if (typeof donestatus.dexid === "string") {
				return `status="4" dexid='${donestatus.dexid}'`;
			}
			if (typeof donestatus.dexid !== "object")
				return null;
			return `status="5" dexid="${donestatus.dexid.id}" by="${donestatus.dexid.by}"`;
		}
		if (donestatus.dexids) {
			if (!(typeof donestatus.dexids === "object"))
				return null;
			if (donestatus.dexids.find(f => f.by === null)) {
				let otherGroupStatus = donestatus.dexids.filter(f => f.by !== null);
				let oid = `${otherGroupStatus.reduce<string>((p, v) => p += `${v.id},`, "").slice(0, -1)}`;
				let oby = `${otherGroupStatus.reduce<string>((p, v) => p += `${v.by} / `, "").slice(0, -3)}`;
				let bntRedoStatus = donestatus.dexids.find(f => f.by === null);
				let firstDOMChapter = `status='5' dexids="${oid}" by="${oby}"`;
				if (bntRedoStatus.id)
					return { redoDOMChapter: `status='4' dexid='${bntRedoStatus.id}'`, firstDOMChapter };
				return {
					redoDOMChapter:
						getStatus({ status: [...status, null], released: chapter.released, info: chapter.info }),
					firstDOMChapter
				};
			}
			let all = donestatus.dexids.filter(f => f.by !== null);
			let ids = `${all.reduce<string>((p, c) => p += `${c.id},`, "").slice(0, -1)}`;
			let bys = `${all.reduce<string>((p, c) => p += `${c.by} / `, "").slice(0, -3)}`;
			return `status='5' dexids="${ids}" by="${bys}"`;
		}
	}

	let getStatus = (chapter: Chapter | ChapterStatusLiteral): string | DoneStatus => {
		const [tl, pr, cl, rd, ts, qc, rl] = chapter.status;
		const status: ChapterNRStatus = [tl, pr, cl, rd, ts, qc];
		const donestatus = rl;
		if (!donestatus) {
			return getUndoneStatus(status, chapter);
		} else {
			return getDoneStatus(status, donestatus, chapter);
		}
	}

	let getVolumesHTML = () => {
		let returnHTML = "", volumeGenerator = nextVolume(series), oneVolChapters = volumeGenerator.next();
		let allChapters: Chapter[] = null;
		while (!oneVolChapters.done) {
			allChapters = oneVolChapters.value;
			if (allChapters[0].volume)
				returnHTML += `\t<volume volid=${allChapters[0].volume}>\n`;
			allChapters.forEach(chapter => {
				let status = getStatus(chapter);
				if (typeof status === "object")
					returnHTML += `\t${chapter.volume ? "\t" : ""}<chapter ${status.firstDOMChapter} label='${chapter.name || ""}' chid='${parseInt(series.id) * 1000 + parseInt(chapter.id)}' ${chapter.volume ? `volume='${chapter.volume || ""}'` : ""}>${chapter.id}</chapter>\n\t${chapter.volume ? "\t" : ""}<chapter label="(BNT Redo)" chn="${chapter.id}" ${status.redoDOMChapter} chid="${parseInt(series.id) * 2000 + redos++}"></chapter>`;
				else
					returnHTML += `\t${chapter.volume ? "\t" : ""}<chapter ${status} label='${chapter.name || ""}' chid='${parseInt(series.id) * 1000 + parseInt(chapter.id)}' ${chapter.volume ? `volume='${chapter.volume || ""}'` : ""}>${chapter.id}</chapter>\n`;
			});
			if (allChapters[0].volume)
				returnHTML += `\t</volume>\n`;
			oneVolChapters = volumeGenerator.next();
		}
		return returnHTML;
	}

	data.html += getVolumesHTML();
	data.volume = `${getLastDoneVolume() || "null"};`;
	data.html = `<manga name='${series.getName()}' dexid="${series.dexID}">
${data.html}
</manga>`;
	send(data);

}

let updateMore = (list: DatabaseSeriesData) => {
	list.series.forEach(e => {
		updateSeries(e);
	});
}

export const Site = { send, check: checkIfSiteIsUp, update: updateSeries, updateAll: updateMore };
