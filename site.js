const http = require("http");
require("./extends.js");


const siteHost = "localhost";
// const siteHost = "borednichetranslatorscans.mywebcommunity.org";

let checkIfSiteIsUp = () => {
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

let sendDataToServer = (data) => {
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

let send = (data) => {
	checkIfSiteIsUp()
		.then(_ => {
			sendDataToServer(data)
				.then(console.log)
				.catch(console.error);
		})
		.catch(console.error);
}

let updateSeries = (series) => {
	if (!series.siteName)
		return "no siteName";

	let data = { pass: process.env.SitePASS };

	data.pathName = series.siteName;

	data.html = ``;

	let getLastVolume = () => {
		let lv = -1;
		series.chapters.forEach(e => {
			if (parseInt(e.volume) > lv)
				lv = parseInt(e.volume);
		});
		console.log("Found last volume of ", series.name, lv, series.chapters);
		return lv;
	}

	let getLastDoneVolume = () => {
		let r = null;
		let n = parseInt(getLastVolume());
		while (!r) {
			if (n === -1)
				return null;
			if (series.chapters.whereOne(c => (c.volume == n) && (c.status.reduce((a, b) => (a + !!b)) > 1)))
				r = n;
			n--;
		}
		return r;
	}

	function* nextVolume(s) {
		let x = 0;
		let lv = getLastVolume();
		if (lv === -1) {
			yield s.chapters;
			return;
		}
		while (x < lv) {
			x++;
			yield s.chapters.where(c => c.volume == x);
		}
		return null;
	}

	let redos = 0;

	let getMissingsAndLvl = status => {
		const missStr = ["missedTL", "missedPR", "missedCL", "missedRD", "missedTS", ""];
		let lvl = 0;
		status.reduce((p, c, i) => {
			if (e)
				lvl = i + 1;
			if (lvl > 2)
				lvl--;
			if (!c)
				if (missStr[i])
					p += ` ${missStr[i]}='true'`;
		});
		return { lastVolume: lvl, missings: miss };
	}

	// get status of 0-stated series
	let getUndoneStatus = (status, chapter) => {
		let { missings, lastVolume } = getMissings(status);
		//console.log(`Chapter ${chapter.id} lvl: ${lvl}`, chapter.status);
		if (lastVolume > 0)
			return `status="3" s3="${lastVolume}"${missings}`;
		else {
			return `status="${chapter.released ? "2" : "1"}"${chapter.info ? ` sstat=${chapter.info}` : ""}`;
		}
	}

	// get status of Done series
	let getDoneStatus = (status, donestatus) => {
		if (donestatus.dexid) {
			if (typeof donestatus.dexid === "string") {
				return `status="4" dexid='${donestatus.dexid}'`;
			}
			if (typeof donestatus.dexid !== "object")
				return null;
			return `status="5" dexid="${donestatus.dexid.id}" by="${donestatus.dexid.by}"`;
		}
		if (donestatus.dexids) {
			if (!(typeof donestatus.dexids === "object") && !(donestatus.dexids instanceof Array))
				return null;
			if (donestatus.dexids.whereOne(f => f.by === null)) {
				let otherGroupStatus = donestatus.dexids.where(f => f.by !== null);
				let oid = `${otherGroupStatus.convertAll(c => `${c.id},`).join("").slice(0, -1)}`;
				let oby = `${otherGroupStatus.convertAll(c => `${c.by} / `).join("").slice(0, -3)}`;
				let bntRedoStatus = donestatus.dexids.whereOne(f => f.by === null);
				let firstDOMChapter = `status='5' dexids="${oid}" by="${oby}"`;
				if (bntRedoStatus.id)
					return { redoDOMChapter: `status='4' dexid='${n.id}'`, firstDOMChapter };
				return {
					redoDOMChapter:
						getStatus({ status: [...status, 0], released: chapter.released, info: chapter.info }),
					firstDOMChapter
				};
			}
			let all = donestatus.dexids.where(f => f.by !== null);
			let ids = `${all.convertAll(c => `${c.id},`).join("").slice(0, -1)}`;
			let bys = `${all.convertAll(c => `${c.by} / `).join("").slice(0, -3)}`;
			return `status='5' dexids="${ids}" by="${bys}"`;
		}

	}

	let getStatus = chapter => {
		const status = chapter.status.slice(0, 6);
		const donestatus = chapter.status.slice(6)[0];
		if (!donestatus) {
			return getUndoneStatus(status, chapter);
		} else {
			return getDoneStatus(status, donestatus);
		}
	}

	let getVolumesHTML = () => {
		let returnHTML = "", chaptersFromVolume = null, volumeGenerator = nextVolume(series);
		while (!(chaptersFromVolume = volumeGenerator.next()).done) {
			chaptersFromVolume = chaptersFromVolume.value;
			if (chaptersFromVolume[0].volume)
				returnHTML += `\t<volume volid=${chaptersFromVolume[0].volume}>\n`;
			chaptersFromVolume.forEach(chapter => {
				let status = getStatus(chapter);
				if (status.firstDOMChapter)
					returnHTML += `\t${chapter.volume ? "\t" : ""}<chapter ${status.s1} label='${chapter.name || ""}' chid='${parseInt(series.id) * 1000 + parseInt(chapter.id)}' ${chaptersFromVolume.volume ? `volume='${chapter.volume || ""}'` : ""}>${chapter.id}</chapter>\n\t${chapter.volume ? "\t" : ""}<chapter label="(BNT Redo)" chn="${chapter.id}" ${status.redoDOMChapter} chid="${parseInt(series.id) * 2000 + parseInt(redos++)}"></chapter>`;
				else
					returnHTML += `\t${chapter.volume ? "\t" : ""}<chapter ${status} label='${chapter.name || ""}' chid='${parseInt(series.id) * 1000 + parseInt(chapter.id)}' ${chaptersFromVolume.volume ? `volume='${chapter.volume || ""}'` : ""}>${chapter.id}</chapter>\n`;
			});
			if (chaptersFromVolume[0].volume)
				returnHTML += `\t</volume>\n`;
		}
		return returnHTML;
	}

	data.html += getVolumesHTML();

	data.volume = `${getLastDoneVolume() || "null"};`;


	data.html = `<manga name='${series.name.join ? series.name[0] : series.name}' dexid="${series.dexID}">
${data.html}
</manga>`;

	send(data);

}

let updateMore = (list) => {

}

module.exports.Site = { send, check: checkIfSiteIsUp, update: updateSeries, updateAll: updateMore };
