'use strict';

const config = require('../../../config.json');
const build = require('../utils/build.js');
const log = require('../../helpers/log.js');
const errors = require('../../helpers/errors.js');

/**
 * rt_about table definition
 * @type {RTTableSchema}
 * @private
 */
const TABLE = {
  name: config.tables.rt.about,
  fields: [
    {
      "name": "compile_date",
      "type": "INTEGER",
      "attributes": "NOT NULL"
    },
    {
      "name": "gtfs_publish_date",
      "type": "INTEGER",
      "attributes": "NOT NULL"
    },
    {
      "name": "start_date",
      "type": "INTEGER",
      "attributes": "NOT NULL"
    },
    {
      "name": "end_date",
      "type": "INTEGER",
      "attributes": "NOT NULL"
    },
    {
      "name": "version",
      "type": "INTEGER",
      "attributes": "NOT NULL"
    },
    {
      "name": "notes",
      "type": "TEXT",
      "attributes": "NOT NULL"
    }
  ]
};


/**
 * Build rt_about table
 * @type {buildTable}
 * @private
 */
function buildTable(db, agencyOptions, callback) {
  build.create(db, TABLE, function() {
    _init(db, agencyOptions, callback);
  });
}


/**
 * Add rt_about data
 * @private
 */
function _init(db, agencyOptions, callback) {
  log("        ... Adding rt_about data");

  // Get GTFS Publish Date
  let publish = _yyyymmdd(agencyOptions.published);

  // Get compile Date
  let compile = _yyyymmdd(agencyOptions.compiled);

  // Get version
  let version = agencyOptions.version;

  // Set notes
  let notes = agencyOptions.notes;
  if ( agencyOptions.notes === undefined ) {
    let c = agencyOptions.compiled.toLocaleString();
    notes = "This schedule database was automatically compiled on " + c + " due to a schedule data update from " + agencyOptions.agency.name + ".";
  }

  // Get Start and End Dates from gtfs_calendar
  let start = compile;
  let end = compile;
  db.get("SELECT MIN(start_date) AS start, MAX(end_date) AS end FROM " + config.tables.gtfs.calendar + ";", function(err, row) {
    if ( err ) {
      let msg = "Could not get DB start and/or end dates";
      log.error("        ERROR: " + msg);
      errors.error(msg, "rt_about data has not been set", agencyOptions.agency.id);
      return callback();
    }

    // Set calendar start/end dates
    let calendar_start = row.start;
    let calendar_end = row.end;

    // Get Start and End Dates from gtfs_calendar_dates
    db.get("SELECT MIN(date) AS start, MAX(date) AS end FROM " + config.tables.gtfs.calendar_dates + ";", function(err, row) {
      if ( err ) {
        let msg = "Could not get DB start and/or end dates";
        log.error("        ERROR: " + msg);
        errors.error(msg, "rt_about data has not been set", agencyOptions.agency.id);
        return callback();
      }

      // Set calendar_dates start/end dates
      let dates_start = row.start;
      let dates_end = row.end;


      // Get Start Date
      if ( calendar_start === null ) {
        start = dates_start;
      }
      else if ( dates_start === null ) {
        start = calendar_start;
      }
      else if ( dates_start <= calendar_start ) {
        start = dates_start;
      }
      else if ( calendar_start < dates_start ) {
        start = calendar_start;
      }

      // Get End Date
      if ( calendar_end === null ) {
        end = dates_end;
      }
      else if ( dates_end === null ) {
        end = calendar_end;
      }
      else if ( calendar_end >= dates_end ) {
        end = calendar_end;
      }
      else if ( dates_end > calendar_end ) {
        end = dates_end;
      }


      // INSERT DATA
      let sql = "INSERT INTO " + config.tables.rt.about + " (compile_date, gtfs_publish_date, start_date, end_date, version, notes) VALUES (" + compile + ", " + publish + ", " + start + ", " + end + ", " + version + ", '" + notes + "');";
      db.exec(sql, function() {
        return callback();
      });


    });
  });


}



/**
 * Generate a Date Int from the specified date
 * @param date JS Date
 * @returns {string} Date Int
 * @private
 */
function _yyyymmdd(date) {
  let yyyy = date.getFullYear();
  let mm = date.getMonth()+1;
  let dd  = date.getDate();
  return String(10000*yyyy + 100*mm + dd);
}



module.exports = buildTable;