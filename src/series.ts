import Mongo = require('mongodb');
import { DayOfTheWeek } from './datefn';
import { Site } from "./site";

export type DexID = {
  id?: string,
  by?: string
}

export type ReleaseStatus = {
  dexid?: string | DexID,
  dexids?: DexID[],
  msgID?: string
};

export type BreakableStatus = {
  partial: boolean,
  almost: boolean
}

export function isBreakableStatus(channel: BreakableStatus | ReleaseStatus): channel is BreakableStatus {
  return channel.hasOwnProperty("partial");
}

export type CLRDTSStatus = BreakableStatus | number;

export type ChapterStatus = [number, number, CLRDTSStatus, CLRDTSStatus, CLRDTSStatus, number, ReleaseStatus];

export interface Chapter {
  id: string
  status: ChapterStatus
  startDate: Date
  name?: string
  volume?: string
  released?: string
  info?: string
  sDate?: Date
  late?: number
  weekSkip?: number
}

type ChapterFunctions = {
  getCurrent?: () => Chapter,
  get?: (id: string | number) => Chapter
}

type SeriesFunctions = {
  getByName?: (name: string) => Series,
  get?: (id: string | number) => Series,
  getSeries?: (identifier: string) => Series | Series[]
}

export type Schedule = {
  dows: [DayOfTheWeek, DayOfTheWeek, DayOfTheWeek, DayOfTheWeek, DayOfTheWeek, DayOfTheWeek, DayOfTheWeek]
}

export interface Series {
  parent?: SData
  ceased?: boolean
  id: string
  name: string | string[]
  mention: string
  statusCodes: string[]
  chapters: (Chapter[] & ChapterFunctions)
  schedule?: Schedule
  siteName: string
  current: string
  dexID: string
  getName: () => string
  getIndexOfStatus: (st: string) => number
}

export type DatabaseSeriesData = {
  series: Series[] & SeriesFunctions
}

export type SData = {
  data: DatabaseSeriesData,
  loaded?: boolean,
  showVal?: number,
  save?: () => Promise<void>,
  reload?: () => Promise<void>
}

export let getIntFromSN = (i: string | number) => (typeof i === "number" ? i : parseInt(i));
export let getFloatFromSN = (i: string | number) => (typeof i === "number" ? i : parseFloat(i));

export let SeriesData: SData;

export let safeRegex: (rn: string) => RegExp = ((rn: string) => new RegExp(rn.replace(/([\+\-\[\]\\\(\)\*\.\?\{\}])/g, "\\$1"), "i"));;

export let loadDBData = async () => {
  SeriesData = { showVal: 2, loaded: false, data: null };
  SeriesData.save = () => {
    if (!SeriesData.data) throw "No data to send!";
    SeriesData.data.series.forEach(e => e.parent = null);
    //console.log(data);
    return new Promise<void>(async (res) => {
      // save data to DB
      const uri = process.env.MONGOURI;
      const mongoClient = new Mongo.MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
      try {
        await mongoClient.connect();
        let db = mongoClient.db("scheduler");
        let coll = db.collection("series");
        for (let i = 0; i < SeriesData.data.series.length; i++) {
          let series = SeriesData.data.series[i];
          await coll.updateOne({ id: series.id }, { $set: series }, { upsert: true });
        }
        Site.updateAll(SeriesData.data);
      } catch (err) {
        console.error("Monog error:", err, err.stack);
      } finally {
        mongoClient.close();
      }
      SeriesData.data.series.forEach(e => e.parent = SeriesData);
      res();
    });
  }
  SeriesData.reload = async () => {
    // load data from DB
    console.log("Series.ts Mongouri:", process.env.MONGOURI);
    const uri = process.env.MONGOURI;
    const mongoClient = new Mongo.MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
      await mongoClient.connect();
      let db = mongoClient.db("scheduler");
      let coll = db.collection("series");
      let xxinput: Series[] = [];
      let projection = {
        _id: 0, id: 1,
        mention: 1,
        statusCodes: 1,
        name: 1,
        chapters: 1,
        current: 1,
        schedule: 1,
        siteName: 1,
        dexID: 1
      };
      let cur = coll.find({ id: { $gt: 0 } }, { sort: { id: 1 }, projection });
      await cur.forEach((e: Series) => xxinput.push(e as Series));
      SeriesData.data = { series: xxinput };
      SeriesData.loaded = true;
      SeriesData.data.series.forEach(e => {
        e.parent = SeriesData;
        e.chapters.forEach(ch => {
          if (ch.status[6] === 0)
            ch.status[6] = null;
        });
        if (!e.statusCodes || e.statusCodes.length !== 7)
          e.statusCodes = ["TL", "PR", "CL", "RD", "TS", "QC", "RL"];
        e.chapters.get = (id) => {
          if (!id) return null;
          let ret = null;
          e.chapters.forEach(e => {
            if (ret) return;
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
              if (ind === 0) return;
              if (chap.startDate) return lc = chap;
            });
            return lc;
          }
        }
        e.getName = () => {
          if (e.name instanceof Array)
            return e.name[0];
          else return e.name;
        }
        e.getIndexOfStatus = (st) => {
          let r = -1;
          e.statusCodes.forEach((e, i) => {
            if (r >= 0) return;
            if (`${e}`.toLowerCase() === `${st}`.toLowerCase())
              r = i;
          });
          return r === -1 ? null : r;
        }
      });
      SeriesData.data.series.getByName = (name) => {
        if (!name) return null;
        /**
         * Return value
         * @type {string}
         */
        let ret = null;
        SeriesData.data.series.forEach(e => {
          if (ret) return;
          if (e.name instanceof Array) {
            e.name.forEach(n => {
              if (ret) return;
              if (n.match(safeRegex(name)))
                ret = e;
            });
          }
          else
            if (e.name.match(safeRegex(name)))
              ret = e;
        });
        return ret;
      }
      SeriesData.data.series.get = (id) => {
        if (!id) return null;
        let ret = null;
        SeriesData.data.series.forEach(e => {
          if (ret) return;
          if (e.id == id)
            ret = e;
        });
        return ret;
      };
      SeriesData.data.series.getSeries = (identifier) => {
        if (!identifier) return null;
        let ret = null;
        SeriesData.data.series.forEach(e => {
          let nameMatches = false;
          if (e.name instanceof Array) {
            e.name.forEach(n => {
              if (nameMatches) return;
              nameMatches = !!n.match(safeRegex(identifier));
            });
          } else {
            nameMatches = !!e.name.match(safeRegex(identifier));
          }
          if (e.id == identifier || nameMatches) {
            if (ret && !(ret instanceof Array))
              ret = [ret];
            if (ret instanceof Array) ret.push(e); else ret = e;
          }
        });
        return ret;
      }
    } catch (err) {
      console.error(err.stack);
    } finally {
      mongoClient.close();
    }
  };
  await SeriesData.reload();
}
loadDBData();