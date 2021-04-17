const http = require("http");

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
				path: "/series.php",
				method:"POST",
				headers: {
					'Content-Type':"application/json"
				}
			},
			(res)=>{
				res.on("data", (data)=>{
					if(`${data}`.charAt(0) !== "0"){
						r("Succesfully updated!");
					} else {
						q("Something went wrong!\n" + `\n====\n\n${data}\n\n====`);
					}
				});
			}
		);
		req.write(JSON.stringify({a:"0"}));
		req.end();
	});
}

let send = (data)=>{
	checkIfSiteIsUp()
	.then(_=>{
		sendDataToServer("<tr>")
		.then(console.log)
		.catch(console.error);
	})
	.catch(console.error);
}

let updateSeries = (series)=>{
	if(!series.siteName)
		return;
	let data = {};
	data.pathName = series.siteName;

	data.html = ``;

	function* nextVolume(){
		
	}

	data.html += `
<manga name='${series.name.join?series.name[0]:series.name}' dexid="${series.dexID}">
</manga>
	`; 

}

module.exports.Site = {send, check:checkIfSiteIsUp, update:updateSeries};
