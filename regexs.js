// user consts
const RGX = {
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
  _new: /^\s*(chapter)$/i
}

module.exports.RGX = RGX;