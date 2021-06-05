Number.isEven = x => (parseInt(`${x}`) || 0) % 2 == 0;
console.logOnce = (id, showid, ...log) => {
    if (!console.LoggedArray)
        console.LoggedArray = [];
    if (console.LoggedArray.filter(e => e === id).length > 0)
        return null;
    if (!showid)
        console.log(...log);
    else
        console.log(id, ...log);
    console.LoggedArray.push(id);
};
console.logTimes = (id, times, showid, ...log) => {
    if (!console.TimesArray)
        console.TimesArray = [];
    let arr;
    if (arr = console.TimesArray.find(e => e.id === id)) {
        // more than once
        if (arr.t++ < arr.max) {
            if (!showid)
                console.log(...log);
            else
                console.log(id, ...log);
        }
        return;
    }
    if (!showid)
        console.log(...log);
    else
        console.log(id, ...log);
    console.TimesArray.push({ id: id, t: 1, max: times });
};
if (!Array.prototype.last) {
    Array.prototype.last = function () {
        if (!this.length) {
            return undefined;
        }
        return this[this.length - 1];
    };
}
if (!Array.prototype.setLast) {
    Array.prototype.setLast = function (value) {
        if (!this.length)
            return undefined;
        return this[this.length - 1] = value;
    };
}
if (!Array.prototype.unsetItem) {
    Array.prototype.unsetItem = function (index) {
        if (index === -1)
            return undefined;
        return this.splice(index, 1)[0];
    };
}
if (!Array.prototype.unsetLastItem) {
    Array.prototype.unsetLastItem = function () { return this.unsetItem(this.length - 1); };
}
// Deletes last item of the array
// Deletes item with given index (short for this.splice(x,1))
// Deletes all items from the array
// returns array of all deleted elements
Array.prototype.clear = function () { this.length = 0; };
//# sourceMappingURL=extends.js.map