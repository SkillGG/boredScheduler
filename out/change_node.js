"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config({ path: ".env" });
const mongodb_1 = require("mongodb");
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield new Promise((res, req) => __awaiter(void 0, void 0, void 0, function* () {
        // save data to DB
        const uri = process.env.MONGOURI;
        const client = new mongodb_1.MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        try {
            yield client.connect();
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
            //await coll.updateOne({ id: 3 }, { $set: { "chapters.$[chap].volume": "1" } }, { arrayFilters: [{ "chap.id": "1" }] });
            // await coll.updateOne({id: 1}, {$set: {schedule:null} });
            /* Set all ReleaseStatus to null */
            // backup
            // let failsafe = JSON.stringify(await coll.find({}).toArray());
            // fs.writeFileSync("./_pretest_database.json", failsafe);
            let allData = coll.find({});
            let all = [];
            yield allData.forEach((e) => all.push(e));
            for (let i = 0; i < all.length; i++)
                if (all[i].dexID)
                    yield coll.updateOne({ id: all[i].id }, { $set: { "sitePage": [{ dexid: all[i].dexID }] } });
                else
                    yield coll.updateOne({ id: all[i].id }, { $unset: { "sitePage": true } });
            //console.log(fs.readFileSync("./_pretest_database.json"));
            // restore
            // let x = JSON.parse(fs.readFileSync("./_pretest_database.json", "utf-8"));
            // await coll.deleteMany({});
            // await coll.insertMany(x);
            // console.log(
            // 	await coll.updateMany({ chapters: { $elemMatch: { "status.6": 0 } } }, { $set: { "chapters.$[x].status.6": null } }, { arrayFilters: [{ "x.status.6": 0 }] })
            // );
            console.log("done");
        }
        catch (err) {
            console.error(err.stack);
        }
        finally {
            client.close();
        }
        res();
    }));
}))();
//# sourceMappingURL=change_node.js.map