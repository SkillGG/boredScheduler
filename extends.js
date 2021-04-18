/***
	Small handy set of functions to improve visibility of code :P
	Coded by: SkillGG
	VERSION: 1.15

*/
// Checks if number is even
Number.isEven=x=>(parseInt(x)||0)%2==0;
// Logs just once
console.logOnce = (id, showid, ...log)=>{
	if(!console.LoggedArray) console.LoggedArray = [];
	if(console.LoggedArray.where(e=>e===id).length > 0) return null;
	if(!showid)	console.log(...log);
	else console.log(id, ...log);
	console.LoggedArray.push(id);
}
console.logTimes = (id, times,showid, ...log)=>{
	if(!console.TimesArray) console.TimesArray = [];
	let arr;
	if(arr = console.TimesArray.whereOne(e=>e.id===id)){
		// more than once
		if(arr.t++ < arr.max){
			if(!showid) console.log(...log);
			else console.log(id, ...log);
		}
		return;
	}
	if(!showid)	console.log(...log);
	else console.log(id, ...log);
	console.TimesArray.push({id: id, t:1, max: times});
}
// Returns last item of the array
Array.prototype.getLastItem = function() { return this[this.length-1] || null; };
// Sets last item of the array to given value
Array.prototype.setLastItem = function(value) { return (this[this.length-1] = value); };
// Deletes last item of the array
Array.prototype.unsetLastItem = function() { return this.unsetItem(this.length-1); };
// Deletes item with given index (short for this.splice(x,1))
Array.prototype.unsetItem = function(index){
	if(index === -1)
		return null;
	return this.splice(index, 1)[0];
}
// C# LINQ's Array.ConvertAll<T>(Converter<TIn, TOut>)
// Converts all items in array according to converter
Array.prototype.convertAll = function(converter){
	let ret = [];
	this.forEach((e,i)=>{
		ret[i] = converter(e);
	});
	return ret;
}
// C# LINQ's Array.Find(cb, value)
// returns array of items that return true when parsed through func f
Array.prototype.where = function(f) {
	if(typeof f !== "function") return null;
	let ret = [];
	this.forEach((e,i,a)=>{if(f(e,i,a))ret.push(e);});
	return ret;
};
// Deletes all items from the array
// returns array of all deleted elements
Array.prototype.clear = function() { return this.splice(0, this.length); };
// Does d(e,i,a) on each element in array that successfully passes f(e) test (returns true value)
Array.prototype.doWhere = function(f, d) {
	if(typeof f !== "function" || typeof d !== "function") return;
	this.where(f).forEach(d);
}
// Returns indexOf firt item that passes through func f
Array.prototype.indexWhere = function(f){
	return this.indexOf(this.whereOne(f));
}
// First from .where
// returns first item that returns true when parsed through func f
Array.prototype.whereOne = function(f) { return this.where(f)[0] || null; };
// .where() that makes available multi-purpose checking functions
Array.prototype.valuedWhere = function(f, v){
	if(typeof f !== "function") return null;
	let ret = [];
	this.forEach((e,i,a)=>{
		if(typeof v === "string"){
			v=v==="$a"?a:v;
			v=v==="$e"?e:v;
			if(f(e,v.replace(/\${2}/g, " ").replace(/\$i/gi, i).replace(/ /g,"$"))) ret.push(e);
		}
		else
			if(f(e,v)) ret.push(e);
	});
	return ret;
};
// Pushes to array if there is no same element
Array.prototype.pushIfNot = function(el) {
	if(this.indexOf(el) !== -1){
		return !1;
	}
	//else if(/* TODO: Check for attributes and values */) return false;
	this.push(el);
	return !0;
}
// Pushes to array. If there is already an element it changes its value instead of doubling it.
Array.prototype.pushIfNotChange = function(el) {
	if(this.indexOf(el) !== -1){		// if object exists
		return this[this.indexOf(el)] = el,!0; // change and return true
	}
	//else if(/* TODO: Check for attributes and values */){		// if object with more/less attributes, but same values
		// TODO: 
	//}
	else this.push(el); // push
}
// It changes text into regular Expression.
RegExp.toRegExp = function(text){ return new RegExp(text.replace(/([\\\/$^.])/g, `\\$1`)); }
// It concatenates all regexes into one with given flag.
RegExp.concat = function (flags, ...regexs){
	let srcs = "";
	for(r in regexs){
		if(typeof regexs[r] === 'object'){
			srcs += regexs[r].source;
		}
		else if(typeof regexs[r] === 'string'){
			srcs += regexs[r];
		}
	}
	let rex = new RegExp(srcs, flags);
	// console.log(rex);
	return rex;
}