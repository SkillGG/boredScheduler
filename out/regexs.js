"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// user consts
const url_1 = require("url");
exports.isStringURL = (s, protocols = ["http", "https"]) => {
    try {
        let url = new url_1.URL(s);
        return protocols
            ? url.protocol
                ? protocols.map(x => `${x.toLowerCase()}:`).includes(url.protocol)
                : false
            : true;
    }
    catch (err) {
        return false;
    }
};
exports.RGX = {
    /*
      $1 - help
      $2 - <SERIES_IDENTIFIER> = #+ / a-z+
      $3 - #+
      $4 - TL|PR|CL|RD|TS|QC|RL
      $5 - .*
    */
    done: /^\s*(help.*$)|(?:(?:([^\r\n\t\f\v]+?)[\s:]+(\d[\d.]*)?)\s*(TL|PR|CLRD|CL|RD|TS|QC|RL)(.+?)?$)/i,
    /*
      $1 - help/chapter/series/all/ceased
      $2 - #+
      $3 - #+[.#+]
    */
    show: /^\s*(help|chapter|series|all|ceased)\s*(?:([^\r\n\t\f\v]+?)[\s:]*(\d[\d.]*)?)?$/i,
    _new: /^\s*(chapter)$/i,
    /**
     * Groups: dexid, cubari, possibly_link
     */
    ReleaseRest: /^(?:(?:manga)?d(?:ex)?:(?<dexid>\d+)|c(?:u?b?a?r?i?):\/?(?<cubari>(?:gist|imgur)\/[A-Za-z]+\/\d+(?:\/\d+)?)|l(?:i?n?k?)?:(?<lname>.+?)=(?<link>.{11,}?))$/i
};
//# sourceMappingURL=regexs.js.map