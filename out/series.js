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
const Mongo = require("mongodb");
const site_1 = require("./site");
const strings_1 = require("./strings");
exports.isDexRelease = (status) => status.hasOwnProperty("dexid");
exports.isCubariRelease = (status) => status.hasOwnProperty("cubari");
exports.isLinkRelease = (status) => status.hasOwnProperty("link");
exports.isBreakableStatus = (channel) => channel.hasOwnProperty("partial");
exports.isDexPage = (p) => !p ? false : p.hasOwnProperty("dexid");
exports.isLinkPage = (p) => !p ? false : p.hasOwnProperty("link");
exports.isCubariPage = (p) => !p ? false : p.hasOwnProperty("cubari");
exports.getIntFromSN = (i) => (typeof i === "number" ? i : parseInt(i));
exports.getFloatFromSN = (i) => (typeof i === "number" ? i : parseFloat(i));
exports.safeRegex = ((rn) => new RegExp(rn.replace(/([\+\-\[\]\\\(\)\*\.\?\{\}])/g, "\\$1"), "i"));
;
exports.loadDBData = () => __awaiter(void 0, void 0, void 0, function* () {
    exports.SeriesData = { showVal: 2, loaded: false, data: null };
    exports.SeriesData.save = () => {
        if (!exports.SeriesData.data)
            throw "No data to send!";
        exports.SeriesData.data.series.forEach(e => e.parent = null);
        //console.log(data);
        return new Promise((res) => __awaiter(void 0, void 0, void 0, function* () {
            // save data to DB
            const uri = process.env.MONGOURI;
            const mongoClient = new Mongo.MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
            try {
                yield mongoClient.connect();
                let db = mongoClient.db("scheduler");
                let coll = db.collection("series");
                for (let i = 0; i < exports.SeriesData.data.series.length; i++) {
                    let series = exports.SeriesData.data.series[i];
                    yield coll.updateOne({ id: series.id }, { $set: series }, { upsert: true });
                }
                site_1.Site.updateAll(exports.SeriesData.data);
            }
            catch (err) {
                console.error("Monog error:", err, err.stack);
            }
            finally {
                mongoClient.close();
            }
            exports.SeriesData.data.series.forEach(e => e.parent = exports.SeriesData);
            res();
        }));
    };
    exports.SeriesData.reload = () => __awaiter(void 0, void 0, void 0, function* () {
        // load data from DB
        // console.log("Series.ts Mongouri:", process.env.MONGOURI);
        const uri = process.env.MONGOURI;
        const mongoClient = new Mongo.MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        try {
            yield mongoClient.connect();
            let db = mongoClient.db("scheduler");
            let coll = db.collection("series");
            let xxinput = [];
            let projection = {
                _id: 0, id: 1,
                mention: 1,
                statusCodes: 1,
                name: 1,
                chapters: 1,
                current: 1,
                schedule: 1,
                siteName: 1,
                sitePage: 1
            };
            let cur = coll.find({ id: { $gt: 0 } }, { sort: { id: 1 }, projection });
            yield cur.forEach((e) => xxinput.push(e));
            exports.SeriesData.data = { series: xxinput };
            exports.SeriesData.loaded = true;
            exports.SeriesData.data.series.forEach(e => {
                e.parent = exports.SeriesData;
                if (!e.statusCodes || e.statusCodes.length !== 7)
                    e.statusCodes = ["TL", "PR", "CL", "RD", "TS", "QC", "RL"];
                e.chapters.get = (id) => {
                    if (!id)
                        return null;
                    let ret = null;
                    e.chapters.forEach(e => {
                        if (ret)
                            return;
                        if (e.id == id)
                            ret = e;
                    });
                    return ret;
                };
                e.chapters.getCurrent = () => {
                    if (e.current)
                        return e.chapters.get(e.current);
                    else {
                        let lc = e.chapters[0];
                        e.chapters.forEach((chap, ind) => {
                            if (ind === 0)
                                return;
                            if (chap.startDate)
                                return lc = chap;
                        });
                        return lc;
                    }
                };
                e.chapters.getBeforeCurrent = () => e.chapters[e.chapters.indexOf(e.chapters.getCurrent()) - 1];
                e.getMention = () => e.mention ? `<@&${e.mention}> ` : "";
                e.getName = () => {
                    if (e.name instanceof Array)
                        return e.name[0];
                    else
                        return e.name;
                };
                e.getIndexOfStatus = (st) => {
                    let r = -1;
                    (e.statusCodes || strings_1.defaultStatusCodes).forEach((e, i) => {
                        if (r >= 0)
                            return;
                        if (`${e}`.toLowerCase() === `${st}`.toLowerCase())
                            r = i;
                    });
                    return r === -1 ? null : r;
                };
            });
            exports.SeriesData.data.series.getByName = (name) => {
                if (!name)
                    return null;
                let ret = null;
                exports.SeriesData.data.series.forEach(e => {
                    if (ret)
                        return;
                    if (e.name instanceof Array) {
                        e.name.forEach(n => {
                            if (ret)
                                return;
                            if (n.match(exports.safeRegex(name)))
                                ret = e;
                        });
                    }
                    else if (e.name.match(exports.safeRegex(name)))
                        ret = e;
                });
                return ret;
            };
            exports.SeriesData.data.series.get = (id) => {
                if (!id)
                    return null;
                let ret = null;
                exports.SeriesData.data.series.forEach(e => {
                    if (ret)
                        return;
                    if (e.id == id)
                        ret = e;
                });
                return ret;
            };
            exports.SeriesData.data.series.getSeries = (identifier) => {
                if (!identifier)
                    return null;
                let ret = null;
                exports.SeriesData.data.series.forEach(e => {
                    let nameMatches = false;
                    if (e.name instanceof Array) {
                        e.name.forEach(n => {
                            if (nameMatches)
                                return;
                            nameMatches = !!n.match(exports.safeRegex(identifier));
                        });
                    }
                    else {
                        nameMatches = !!e.name.match(exports.safeRegex(identifier));
                    }
                    if (e.id == identifier || nameMatches) {
                        if (ret && !(ret instanceof Array)) {
                            ret = [ret];
                        }
                        if (ret instanceof Array)
                            ret.push(e);
                        else
                            ret = e;
                    }
                });
                return ret;
            };
        }
        catch (err) {
            console.error(err.stack);
        }
        finally {
            mongoClient.close();
        }
    });
    yield exports.SeriesData.reload();
});
//# sourceMappingURL=series.js.map