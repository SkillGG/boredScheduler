const MongoClient = require('mongodb').MongoClient;
(async ()=>{
	await new Promise(async (res,req)=>{
		// save data to DB
		const uri = process.env.MONGOURI;
		const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
		try{
			await client.connect();
			let db = client.db("scheduler");
			let coll = db.collection("series");
			// change DOWS
			// await coll.updateOne({id:1},{$set:{"schedule.dows":[1,2,3,4,5,7,7]}});
			// change title
			// await coll.updateOne({id:2},{$set:{"chapters.$[chap].name":"Anxious circulating nurse"}},{arrayFilters:[{"chap.id":"13"}]});
			// change series name
			// await coll.updateOne({id:2},{$set:{"name":["Opekan","Opekan en","Opekan english", "opekanen"]}});
			// add new chapter
			// await coll.updateOne({id:2},{$push:{chapters:{id:"15",name:"",status:[0,0,0,0,0,0,0]}}});
			// unset value in a chapter
			// await coll.updateOne({id:1},{$unset:{"chapters.$[chap].title":""}},{arrayFilters:[{"chap.id":"13"}]});
			// Change Start Date
			// await coll.updateOne({id:1},{$set:{"chapters.$[chap].startDate":new Date("2021-03-07T23:59:59.878+00:00")}},{arrayFilters:[{"chap.id":"21"}]})
			// Set late chapter
			// await coll.updateOne({id:1},{$set:{"chapters.$[chap].late":1}},{arrayFilters:[{"chap.id":"22"}]});
			// Unset late chapter
			// await coll.updateOne({id:1},{$unset:{"chapters.$[chap].late":""}},{arrayFilters:[{"chap.id":"21"}]});
			console.log("done")
		}catch(err){
			console.error(err.stack);
		}finally {
			client.close();
		}
		res();
	});
})();
