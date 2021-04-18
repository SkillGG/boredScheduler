const http = require("http");
require("./extends.js");


const siteHost = "localhost";
// const siteHost = "borednichetranslatorscans.mywebcommunity.org";

let checkIfSiteIsUp = ()=>{
	return new Promise((r,q)=>{
		const req = http.request(
			{
				hostname: siteHost,
				port: 80,
				path: '/Series/info.php',
				method: 'GET'
			},
			(res) => res.on('data', chunk=>r(`${chunk}`))
		);
		req.on('error', (e) => q(`Problem with request: ${e.message}`));
		// Write data to request body
		req.end();
	});
}

let sendDataToServer = (data)=>{
	return new Promise((r,q)=>{
		const req =
		http.request(
			{
				hostname: siteHost,
				port:80,
				path: "/update.php",
				method:"POST",
				headers: {
					'Content-Type':"application/json"
				}
			},
			(res)=>{
				res.on("data", (data)=>{
					if(`${data}`.charAt(0) === "0"){
						r("Succesfully updated!");
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

let send = (data)=>{
	checkIfSiteIsUp()
	.then(_=>{
		sendDataToServer(data)
		.then(console.log)
		.catch(console.error);
	})
	.catch(console.error);
}

let updateSeries = (series)=>{
	if(!series.siteName)
		return "no siteName";

	let data = {pass: process.env.SitePASS};

	data.pathName = series.siteName;

	data.html = ``;

	let getLastVolume = ()=>{
		let lv = -1;
		series.chapters.forEach(e=>{
			if(parseInt(e.volume) > lv)
				lv = parseInt(e.volume);
		});
		return lv;
	}

	function* nextVolume(s){
		let x = 0;
		let lv = getLastVolume();
		if(lv === -1){
			yield s.chapters;
			return;
		}
		while(x < lv){
			x++;
			yield s.chapters.where(c=>c.volume==x);	
		}
		return null;
	}

	let redos = 0;

	let getStatus = chapter=>{
		const missings = ["missedTL", "missedPR", "missedCL", "missedRD", "missedTS", ""];
		const status = chapter.status.slice(0,6);
		const donestatus = chapter.status.slice(6)[0];
		if(!donestatus){
			let lvl = 0, s = "";
			status.forEach((e,i)=>{
				if(e)
					lvl = i+1;
				if(lvl > 2)
					lvl--;
				if(!e)
					if(missings[i])
						s+=` ${missings[i]}='true'`;
			});
			//console.log(`Chapter ${chapter.id} lvl: ${lvl}`, chapter.status);
			if(lvl > 0)
				return `status="3" s3="${lvl}"${s}`;
			else {
				return `status="${chapter.released?"2":"1"}"${chapter.info?` sstat=${chapter.info}`:""}`;
			}
		}else {
			if(donestatus.dexid){
				if(typeof donestatus.dexid === "string"){
					return `status="4" dexid='${donestatus.dexid}'`;
				}
				if(typeof donestatus.dexid !== "object")
					return null;
				return `status="5" dexid="${donestatus.dexid.id}" by="${donestatus.dexid.by}"`;
			}
			if(donestatus.dexids){
				if(!(typeof donestatus.dexids === "object") && !(donestatus.dexids instanceof Array))
					return null;
				if(donestatus.dexids.whereOne(f=>f.by===null)){
					let o = donestatus.dexids.where(f=>f.by!==null);
					let oid = `${o.convertAll(c=>`${c.id},`).join("").slice(0,-1)}`;
					let oby = `${o.convertAll(c=>`${c.by} / `).join("").slice(0,-3)}`;
					let n = donestatus.dexids.whereOne(f=>f.by===null);
					let retx = {s1:`status='5' dexids="${oid}" by="${oby}"`};
					if(n.id){
						retx.so = `status='4' dexid='${n.id}'`;
						return retx;
					}
					retx.so = getStatus({status:[...status,0], released: chapter.released, info:chapter.info});
					return retx;
				}
				let all = donestatus.dexids.where(f=>f.by!==null);
				let ids = `${all.convertAll(c=>`${c.id},`).join("").slice(0,-1)}`;
				let bys = `${all.convertAll(c=>`${c.by} / `).join("").slice(0,-3)}`;
				return `status='5' dexids="${ids}" by="${bys}"`;
			}
		}
	}

	let getVolumesHTML = ()=>{
		let h = "";
		let x = null;
		let z = nextVolume(series);
		while(!(x = z.next()).done){
			x = x.value;
			if(x[0].volume)
				h += `\t<volume volid=${x[0].volume}>\n`;
			x.forEach(e=>{
				let status = getStatus(e);
				if(status.s1)
					h += `\t${e.volume?"\t":""}<chapter ${status.s1} label='${e.name||""}' chid='${parseInt(series.id)*1000+parseInt(e.id)}' ${x.volume?`volume='${e.volume||""}'`:""}>${e.id}</chapter>\n\t${e.volume?"\t":""}<chapter label="(BNT Redo)" chn="${e.id}" ${status.so} chid="${parseInt(series.id)*2000+parseInt(redos++)}"></chapter>`;
				else
					h += `\t${e.volume?"\t":""}<chapter ${status} label='${e.name||""}' chid='${parseInt(series.id)*1000+parseInt(e.id)}' ${x.volume?`volume='${e.volume||""}'`:""}>${e.id}</chapter>\n`;
			});
			if(x[0].volume)
				h += `\t</volume>\n`;
		}
		return h;
	}

	data.html += getVolumesHTML();

	data.html = `<manga name='${series.name.join?series.name[0]:series.name}' dexid="${series.dexID}">
${data.html}
</manga>`; 

	send(data);

}

module.exports.Site = {send, check:checkIfSiteIsUp, update:updateSeries};
