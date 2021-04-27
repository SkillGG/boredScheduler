const MongoClient = require('mongodb').MongoClient;
(async () => {
	await new Promise(async (res, req) => {
		// save data to DB
		const uri = process.env.MONGOURI;
		const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
		try {
			await client.connect();
			let db = client.db("scheduler");
			let coll = db.collection("series");
			// change DOWS
			// await coll.updateOne({id:1},{$set:{"schedule.dows":[1,2,3,4,5,7,7]}});
			// change title
			// await coll.updateOne({id:2},
			// {$set:{"chapters.$[chap].name":"Anxious circulating nurse"}},{arrayFilters:[{"chap.id":"13"}]});
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
			// await coll.updateOne({id:1}, {$set:{"siteName":"Denjin"}});
			// await coll.updateOne({id:2}, {$set:{"siteName":"Opekan"}});
			// await coll.updateOne({id:3}, {$set:{"siteName":"Hirozetsu"}});
			// await coll.updateOne({id:4}, {$set:{"siteName":"Minasama"}});
			// await coll.updateOne({id:1}, {$set:{"dexID":"43504"}});
			// await coll.updateOne({id:2}, {$set:{"dexID":"57539"}});
			// await coll.updateOne({id:3}, {$set:{"dexID":"56318"}});
			// await coll.updateOne({id:4}, {$set:{"dexID":"26793"}});
			// await coll.updateOne({id:4},
			// {$set:{"chapters.$[chap].status.6":{dexids:[{id:"1173461",by:null},{id:"974322",by:"Murdoch Murdoch Scans"}, {id:"833289", by:"no group"}]}}},
			// {arrayFilters:[{"chap.id":"21"}]});
			// Mark as released
			// await coll.updateOne({id:1},{$set:{"chapters.$[chap].released":true}},{arrayFilters:[{"chap.id":"24"}]});
			// await coll.updateOne({id:1},{$set:{"chapters.$[chap].released":true}},{arrayFilters:[{"chap.id":"25"}]});
			// await coll.updateOne({id:1},{$set:{"chapters.$[chap].released":true}},{arrayFilters:[{"chap.id":"26"}]});
			await coll.updateOne({ id: 3 }, { $set: { "chapters.$[chap].volume": "1" } }, { arrayFilters: [{ "chap.id": "1" }] });
			console.log("done")
		} catch (err) {
			console.error(err.stack);
		} finally {
			client.close();
		}
		res();
	});
})();
