"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const series_1 = require("./series");
const strings_1 = require("./strings");
require("./extends");
let checkIfSiteIsUp = () => {
    return new Promise((r, q) => {
        const req = http.request({
            hostname: strings_1.siteHost,
            port: 80,
            path: '/Series/info.php',
            method: 'GET'
        }, (res) => res.on('data', chunk => r(`${chunk}`)));
        req.on('error', (e) => q(`Problem with request: ${e.message}`));
        // Write data to request body
        req.end();
    });
};
let sendDataToServer = (data) => {
    return new Promise((r, q) => {
        const req = http.request({
            hostname: strings_1.siteHost,
            port: 80,
            path: "/update.php",
            method: "POST",
            headers: {
                'Content-Type': "application/json"
            }
        }, (res) => {
            res.on("data", (data) => {
                if (`${data}`.charAt(0) === "0") {
                    r("Succesfully updated!\n" + `\n===\n\n${data}\n\n====`);
                }
                else {
                    q("Something went wrong!\n" + `\n====\n\n${data}\n\n====`);
                }
            });
        });
        req.write(JSON.stringify(data));
        req.end();
    });
};
let send = (data) => {
    checkIfSiteIsUp()
        .then(_ => {
        sendDataToServer(data)
            .then(d => console.log("Send to server", d))
            .catch(e => console.error("Error: ", e));
    })
        .catch(console.error);
};
let getSitePageAttributes = (page) => {
    if (!page)
        return "";
    if (!Array.isArray(page)) {
        if (series_1.isDexPage(page)) {
            return `dexid="${page.dexid}"`;
        }
        if (series_1.isCubariPage(page)) {
            return `cubari="${page.cubari}"`;
        }
        return `link="${page.link}" linkname="${page.name}"`;
    }
    return page.reduce((e, a, i, arr) => e + getSitePageAttributes(a) + `${arr.lastIndexOf(arr.last()) == i ? "" : " "}`, "");
};
let updateSeries = (series) => {
    if (!series.siteName)
        return "no siteName";
    let data = { pass: process.env.SitePASS };
    data.pathName = series.siteName;
    data.html = ``;
    let redos = 0;
    let getLastVolume = () => {
        let lv = -1;
        series.chapters.forEach(e => {
            if (parseInt(e.volume) > lv)
                lv = parseInt(e.volume);
        });
        return `${lv}`;
    };
    let getLastDoneVolume = () => {
        let r = null;
        let n = parseInt(getLastVolume());
        if (n == -1)
            return null;
        while (n > 0) {
            if (series.chapters.filter(e => `${n}` == e.volume).find(e => !!e.status.find(s => !!s)))
                return n;
            n--;
        }
        return null;
    };
    function* nextVolume(s) {
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
    let getMissingsAndLvl = (status) => {
        const missStr = ["missedTL", "missedPR", "missedCL", "missedRD", "missedTS", ""];
        let lvl = 0;
        let miss = status.reduce((p, c, i) => {
            if (c)
                lvl = i + 1;
            if (lvl > 2)
                lvl--;
            if (!c)
                if (missStr[i])
                    return p + ` ${missStr[i]}='true'`;
            return p;
        }, "");
        return { lastVolume: lvl, missings: miss };
    };
    // get status of 0-stated series
    let getUndoneStatus = (status, chapter) => {
        let { missings, lastVolume } = getMissingsAndLvl(status);
        //console.log(`Chapter ${chapter.id} lvl: ${lvl}`, chapter.status);
        if (lastVolume > 0)
            return `status="3" s3="${lastVolume}"${missings}`;
        return `status="${chapter.released ? "2" : "1"}"${chapter.info ? ` sstat=${chapter.info}` : ""}`;
    };
    // get status of Done series
    let getDoneStatus = (status, donestatus, chapter) => {
        if (series_1.isDexRelease(donestatus)) {
            // Dex
            if (typeof donestatus.dexid === "string")
                return `status="4" dexid='${donestatus.dexid}'`;
            if (!Array.isArray(donestatus.dexid))
                return `status="5" dexid="${donestatus.dexid.id}" by="${donestatus.dexid.by}"`;
            // MultiDex
            let [us, ...others] = donestatus.dexid;
            if (typeof us == "string")
                us = { id: us, by: null }; // convert to DexID
            let firstDOMChapter = `status=5 dexids='${others.reduce((a, v, i, ar) => {
                return a + `${v.id}${ar.lastIndexOf(ar.last()) == i ? "" : ","}`;
            }, "")}' by="${others.reduce((a, v, i, ar) => {
                return a + `${v.by}${ar.lastIndexOf(ar.last()) == i ? "" : " / "}`;
            }, "")}"`;
            if (us.id !== "") {
                return {
                    firstDOMChapter,
                    redoDOMChapter: `status=4 dexid="${us.id}"`
                };
            }
            return {
                firstDOMChapter,
                redoDOMChapter: getStatus({ status: [...status, null], released: chapter.released, info: chapter.info })
            };
        }
        if (series_1.isCubariRelease(donestatus))
            return `status=4 cubari="${donestatus.cubari}"`;
        return `status=4 link="${donestatus.link}" linkname="${donestatus.name}"`;
    };
    let getStatus = (chapter) => {
        const [tl, pr, cl, rd, ts, qc, rl] = chapter.status;
        const status = [tl, pr, cl, rd, ts, qc];
        const donestatus = rl;
        if (!donestatus) {
            return getUndoneStatus(status, chapter);
        }
        else {
            return getDoneStatus(status, donestatus, chapter);
        }
    };
    let getVolumesHTML = () => {
        let returnHTML = "", volumeGenerator = nextVolume(series), oneVolChapters = volumeGenerator.next();
        let allChapters = null;
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
    };
    data.html += getVolumesHTML();
    data.volume = `${getLastDoneVolume() || "null"}`;
    console.log("Volume debug:", data.volume, getLastDoneVolume(), getLastVolume());
    data.html = `<manga name='${series.getName()}' ${getSitePageAttributes(series.sitePage)}">
${data.html}
</manga>`;
    send(data);
};
let getSitePageAElements = (page) => {
    if (!Array.isArray(page)) {
        if (series_1.isDexPage(page)) {
            return `<a class='siteIMG' href="${strings_1.DexTitleLink}${page.dexid}"><img src='md.svg' alt="MangaDex"></a>`;
        }
        if (series_1.isCubariPage(page)) {
            return `<a class='siteIMG' href="${strings_1.CubariChapterLink}${page.cubari.replace(/^\/((?:gist|imgur)\/\S+?)(?:\/\d+(?:\/\d+)?)?$/, "$1")}"><img alt='Cubari' src='cubari.png'></a>`;
        }
        return `<a class='siteIMG' href='${page.link}'>${page.name}</a>`;
    }
    return `${page.reduce((b, p) => b + getSitePageAElements(p), "")}`;
};
let countChapters = (chaps) => chaps.reduce((e, a) => e + +(!!a.status.last()), 0);
let updateMore = (list) => {
    list.series.forEach(e => {
        updateSeries(e);
    });
    let data = { pass: process.env.SitePASS };
    data.mainHTML = `<table>
	<thead>
		<th>Title</th>
		<th width=10%>Links</th>
		<th>Status</th>
	</thead>
	<tbody>
	${list.series.reduce((e, a) => {
        //console.log(a, a.siteName, a.sitePage);
        if (a.siteName && a.sitePage) {
            return e + `
		<tr class='tr' sid=${a.id}>
			<td><a href="./series.php?series=${a.siteName}">${a.getName()}</a></td>
			<td class='olink'>${getSitePageAElements(a.sitePage)}</td>
			<td>${a.finished ? "Finished" : `Translated [${countChapters(a.chapters)}/${a.chapters.length}]`}</td>
		</tr>`;
        }
        return e;
    }, "")}
	</tbody></table>`;
    send(data);
};
exports.Site = { send, check: checkIfSiteIsUp, update: updateSeries, updateAll: updateMore };
//# sourceMappingURL=site.js.map