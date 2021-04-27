const fs = require("fs");
const {gdt} = require("./datefn.js");
const MongoClient = require('mongodb').MongoClient;
let SeriesData;

let safeRegex = rn =>{
  return new RegExp(rn.replace(/([\+\-\[\]\\\(\)\*\.\?\{\}])/g,"\\$1"),"i");
}

let loadDBData = async ()=>{
  SeriesData = {showVal:2, loaded:false};
  SeriesData.save = ()=>{
    if(!SeriesData.data) throw "No data to send!";
    SeriesData.data.series.forEach(e=>e.parent = null);
    //console.log(data);
    return new Promise(async (res,req)=>{
      // save data to DB
      const uri = process.env.MONGOURI;
      const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
      try{
        await client.connect();
        let db = client.db("scheduler");
        let coll = db.collection("series");
        for(let i = 0; i < SeriesData.data.series.length; i++){
          let series = SeriesData.data.series[i];
          await coll.updateOne({id:series.id},{$set:series},{upsert:true});
        }
      }catch(err){
        console.error(err.stack);
      }finally {
        client.close();
      }
      SeriesData.data.series.forEach(e=>e.parent=SeriesData);
      res();
    });
  }
  SeriesData.reload = async ()=>{
    // load data from DB
    const uri = process.env.MONGOURI;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try{
      await client.connect();
      let db = client.db("scheduler");
      let coll = db.collection("series");
      let xxinput = [];
      let projection = {
        _id:0,id:1,
        mention:1,
        statusCodes:1,
        name:1,
        chapters:1,
        current:1,
        schedule:1
      };
      let cur = await coll.find({id:{$gt:0}},{sort:{id:1}, projection});
      await cur.forEach(e=>xxinput.push(e));
      SeriesData.data = {series:xxinput};
      SeriesData.loaded = true;
      SeriesData.data.series.forEach(e=>{
        e.parent = SeriesData;
        if(!e.statusCodes || e.statusCodes.length !== 7)
          e.statusCodes = ["TL","PR","CL","RD","TS","QC","RL"];
        e.chapters.get = (id)=>{
          if(!id)return null;
          let ret = null;
          e.chapters.forEach(e=>{
            if(ret)return;
            if(e.id==id)
              ret = e;
          });
          return ret;
        };
        e.chapters.getCurrent = ()=>{
          if(e.current)
            return e.chapters.get(e.current);
          else {
            let lc = e.chapters[0];
            e.chapters.forEach((chap,ind)=>{
              if(ind === 0) return;
              if(chap.startDate) return lc=chap;
            });
            return lc;
          }
        }
        e.getName = ()=>{
          if(e.name instanceof Array)
            return e.name[0];
          else return e.name;
        }
        e.getIndexOfStatus = (st)=>{
          let r = -1;
          e.statusCodes.forEach((e,i)=>{
            if(r>=0) return;
            if(`${e}`.toLowerCase() === `${st}`.toLowerCase())
              r=i;
          });
          return r===-1?null:r;
        }
      });
      SeriesData.data.series.getByName = (name)=>{
        if(!name) return null;
        let ret = null;
        SeriesData.data.series.forEach(e=>{
          if(ret) return;
          if(e.name instanceof Array){
            e.name.forEach(n=>{
              if(ret) return;
              if(n.match(safeRegex(name)))
                ret = e;
            });
          }
          else
            if(e.name.match(safeRegex(name)))
              ret = e;
        });
        return ret;
      }
      SeriesData.data.series.get = (id)=>{
        if(!id)return null;
        let ret = null;
        SeriesData.data.series.forEach(e=>{
          if(ret)return;
          if(e.id==id)
            ret = e;
        });
        return ret;
      };
      SeriesData.data.series.getSeries = (identifier)=>{
        if(!identifier) return null;
        let ret = null;
        SeriesData.data.series.forEach(e=>{
          let nameMatches = false;
          if(e.name instanceof Array){
            e.name.forEach(n=>{
              if(nameMatches) return;
              nameMatches=!!n.match(safeRegex(identifier));
            });
          }else {
            nameMatches=!!e.name.match(safeRegex(identifier));
          }
          if(e.id == identifier || nameMatches){
            if(ret && !(ret instanceof Array))
              ret = [ret];
            if(ret instanceof Array) ret.push(e); else ret = e;
          }
        });
        return ret;
      }
    }catch(err){
      console.error(err.stack);
    }finally {
      client.close();
    }
  };
  await SeriesData.reload();
}
/*
let loadJSONData = ()=>{
  SeriesData = {showVal:2};
  SeriesData.save = ()=>{
    if(!SeriesData.data) throw "No data to send!";
    SeriesData.data.series.forEach(e=>e.parent = false);
    let data = JSON.stringify(SeriesData.data)
    .replace(/},{/g,"},\n{")
    .replace(/:\[/g,":\n\t[")
    .replace(/\]}/g,"]\n}")
    .replace(/{\[/g,"{\n\t[")
    SeriesData.data.series.forEach(e=>e.parent = SeriesData);
    //console.log(data);
    return new Promise((res,req)=>{
      fs.writeFile("./series.json", data, {
          encoding: "utf-8",
          flag:"w",
          mode:0o666
        },(err)=>{
          if(err){
            console.error(err);
            req();
          }
          else {
            console.log("Saved");
            res();
          }
        }
      );
    });
  }
  SeriesData.reload = ()=>{
    fs.readFile("./series.json","utf-8", (err,data)=>{
      if(err) {
        console.error(err.message);
        throw err;
      }
      SeriesData.data = JSON.parse(data);
      if(!SeriesData.data || !SeriesData.data.series) throw "parsing error!";
      SeriesData.data.series.forEach(e=>{
        e.parent = SeriesData;
        if(!e.statusCodes || e.statusCodes.length !== 7)
          e.statusCodes = ["TL","PR","CL","RD","TS","QC","RL"];
        e.chapters.get = (id)=>{
          if(!id)return null;
          let ret = null;
          e.chapters.forEach(e=>{
            if(ret)return;
            if(e.id==id)
              ret = e;
          });
          return ret;
        };
        e.chapters.getCurrent = ()=>{
          if(e.current)
            return e.chapters.get(e.current);
          else {
            let lc = e.chapters[0];
            e.chapters.forEach((chap,ind)=>{
              if(ind === 0) return;
              if(chap.startDate) return lc=chap;
            });
            return lc;
          }
        }
        e.getName = ()=>{
          if(e.name instanceof Array)
            return e.name[0];
          else return e.name;
        }
        e.getIndexOfStatus = (st)=>{
          let r = -1;
          e.statusCodes.forEach((e,i)=>{
            if(r>=0) return;
            if(`${e}`.toLowerCase() === `${st}`.toLowerCase())
              r=i;
          });
          return r===-1?null:r;
        }
      });
      SeriesData.data.series.getByName = (name)=>{
        if(!name) return null;
        let ret = null;
        SeriesData.data.series.forEach(e=>{
          if(ret) return;
          if(e.name instanceof Array){
            e.name.forEach(n=>{
              if(ret) return;
              if(n.match(safeRegex(name)))
                ret = e;
            });
          }
          else
            if(e.name.match(safeRegex(name)))
              ret = e;
        });
        return ret;
      }
      SeriesData.data.series.get = (id)=>{
        if(!id)return null;
        let ret = null;
        SeriesData.data.series.forEach(e=>{
          if(ret)return;
          if(e.id==id)
            ret = e;
        });
        return ret;
      };
      SeriesData.data.series.getSeries = (identifier)=>{
        if(!identifier) return null;
        let ret = null;
        SeriesData.data.series.forEach(e=>{
          let nameMatches = false;
          if(e.name instanceof Array){
            e.name.forEach(n=>{
              if(nameMatches) return;
              nameMatches=!!n.match(safeRegex(identifier));
            });
          }else {
            nameMatches=!!e.name.match(safeRegex(identifier));
          }
          if(e.id == identifier || nameMatches){
            if(ret && !(ret instanceof Array))
              ret = [ret];
            if(ret instanceof Array) ret.push(e); else ret = e;
          }
        });
        return ret;
      }
    });
  };
  SeriesData.reload();
}*/
loadDBData();


module.exports.SeriesData = SeriesData;