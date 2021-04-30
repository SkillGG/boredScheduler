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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
require("dotenv").config();
var mongodb_1 = require("mongodb");
(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, new Promise(function (res, req) { return __awaiter(void 0, void 0, void 0, function () {
                    var uri, client, db, coll, err_1;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                uri = process.env.MONGOURI;
                                client = new mongodb_1.MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 3, 4, 5]);
                                return [4 /*yield*/, client.connect()];
                            case 2:
                                _a.sent();
                                db = client.db("scheduler");
                                coll = db.collection("series");
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
                                /* Set all ReleaseStatus to null */
                                // backup
                                // let failsafe = JSON.stringify(await coll.find({}).toArray());
                                // fs.writeFileSync("./database.json", failsafe);
                                // restore
                                // let x = JSON.parse(fs.readFileSync("./failsafe.json"));
                                // await coll.deleteMany({});
                                // await coll.insertMany(x);
                                // console.log(
                                // 	await coll.updateMany({ chapters: { $elemMatch: { "status.6": 0 } } }, { $set: { "chapters.$[x].status.6": null } }, { arrayFilters: [{ "x.status.6": 0 }] })
                                // );
                                console.log("done");
                                return [3 /*break*/, 5];
                            case 3:
                                err_1 = _a.sent();
                                console.error(err_1.stack);
                                return [3 /*break*/, 5];
                            case 4:
                                client.close();
                                return [7 /*endfinally*/];
                            case 5:
                                res();
                                return [2 /*return*/];
                        }
                    });
                }); })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); })();
