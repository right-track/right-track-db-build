'use strict';

/**
 * #### Database Sanity Checks
 *
 * This function performs a set list of sanity checks on the compiled
 * agency database.  If any of these checks fail, the function will add the
 * error to the DB compilation exceptions and return false in the callback.
 * @module finish/sanityChecks
 */

const fs = require('fs');
const path = require('path');
const errors = require('../helpers/errors.js');
const log = require('../helpers/log.js');
const config = require('../../config.json');


// Min File Sizes (Bytes)
const MIN_DB_SIZE = 500000;
const MIN_ZIP_SIZE = 250000;


/**
 * List of sanity checks to perform on the agency database.  Each object in this
 * array contains three properties that define the sanity check.
 * @type {object[]}
 * @property {string} name Check Name
 * @property {string} select SQL Select statement to perform
 * @property {function} test Function that accepts a single DB row and returns a boolean (pass/fail)
 * @property {boolean} test.row SQLite DB Row object returned from the SELECT query
 */
const CHECKS = [
  {
    "name": "agency count",
    "select": "SELECT COUNT(agency_id) AS count FROM " + config.tables.gtfs.agency + ";",
    "test": function(row) {
      return row.count > 0;
    }
  },
  {
    "name": "calendar table exists",
    "select": "SELECT COUNT(service_id) AS count FROM " + config.tables.gtfs.calendar + ";",
    "test": function(row) {
      return row.count >= 0;
    }
  },
  {
    "name": "calendar_dates table exists",
    "select": "SELECT COUNT(service_id) AS count FROM " + config.tables.gtfs.calendar_dates + ";",
    "test": function(row) {
      return row.count >= 0;
    }
  },
  {
    "name": "direction 0 updated",
    "select": "SELECT description FROM " + config.tables.gtfs.directions + " WHERE direction_id=0;",
    "test": function(row) {
      return row.description.toLowerCase() !== "this way";
    }
  },
  {
    "name": "direction 1 updated",
    "select": "SELECT description FROM " + config.tables.gtfs.directions + " WHERE direction_id=1;",
    "test": function(row) {
      return row.description.toLowerCase() !== "that way";
    }
  },
  {
    "name": "route count",
    "select": "SELECT COUNT(route_id) AS count FROM " + config.tables.gtfs.routes + ";",
    "test": function(row) {
      return row.count > 0;
    }
  },
  {
    "name": "stop_times count",
    "select": "SELECT COUNT(trip_id) AS count FROM " + config.tables.gtfs.stop_times + ";",
    "test": function(row) {
      return row.count > 0;
    }
  },
  {
    "name": "timetable arrival_time_seconds",
    "select": "SELECT COUNT(trip_id) AS count FROM " + config.tables.gtfs.stop_times + " WHERE arrival_time_seconds IS NULL OR arrival_time_seconds = '';",
    "test": function(row) {
      return row.count === 0;
    }
  },
  {
    "name": "timetable departure_time_seconds",
    "select": "SELECT COUNT(trip_id) AS count FROM " + config.tables.gtfs.stop_times + " WHERE departure_time_seconds IS NULL OR departure_time_seconds = '';",
    "test": function(row) {
      return row.count === 0;
    }
  },
  {
    "name": "stop count",
    "select": "SELECT COUNT(stop_id) AS count FROM " + config.tables.gtfs.stops + ";",
    "test": function(row) {
      return row.count > 0;
    }
  },
  {
    "name": "trip count",
    "select": "SELECT COUNT(trip_id) AS count FROM " + config.tables.gtfs.trips + ";",
    "test": function(row) {
      return row.count > 0;
    }
  },
  {
    "name": "version",
    "select": "SELECT version FROM " + config.tables.rt.about + ";",
    "test": function(row) {
      return row.version > 2017000000;
    }
  },
  {
    "name": "start date",
    "select": "SELECT start_date FROM " + config.tables.rt.about + ";",
    "test": function(row) {
      let today = _yyyymmdd(new Date());
      let start = row.start_date;
      return start > 20170000 && start <= today;
    }
  }
];




/**
 * SQLite Database for Agency
 * @private
 */
let DB = undefined;

/**
 * Right Track Agency
 * @private
 */
let AGENCY = undefined;

/**
 * Final callback function to return to wrap-up process
 * @param {boolean} sane DB Sanity Flag
 * @private
 */
let FINAL_CALLBACK = function(sane) {};

/**
 * Final Sanity Check Flag
 * @private
 */
let SANE = true;



/**
 * Run sanity checks on the specified agency's database
 * @param {object} db SQLite Database
 * @param {object} agencyOptions Agency Options
 * @param {function} callback Sanity check callback function
 * @param {boolean} callback.sane Sanity Check pass flag
 */
function sanityChecks(db, agencyOptions, callback) {
  log("--> Running Sanity Checks");

  // Set Database
  DB = db;

  // Set Agency
  AGENCY = agencyOptions.agency;

  // Set final callback
  FINAL_CALLBACK = callback;

  // Run the file checks
  _fileChecks();

  // Start running the sanity checks
  _runChecks();

}


/**
 * Run file checks
 * Make sure db and zip files exist and are at least a minimum size
 * @private
 */
function _fileChecks() {
  let status = "pass";
  let style = "bgGreen.black.bold";
  let msg = undefined;

  let dbPath = path.normalize(AGENCY.moduleDirectory + '/' + config.locations.files.db);
  let dbZipPath = path.normalize(AGENCY.moduleDirectory + '/' + config.locations.files.dbZip);

  // Make sure files exist
  if ( !fs.existsSync(dbPath) ) {
    status = "FAIL";
    msg = "DB file not found";
  }
  else if ( !fs.existsSync(dbZipPath) ) {
    status = "FAIL";
    msg = "DB Zip file not found";
  }
  else if ( fs.statSync(dbPath).size < MIN_DB_SIZE ) {
    status = "FAIL";
    msg = "DB file too small";
  }
  else if ( fs.statSync(dbPath).size < MIN_ZIP_SIZE ) {
    status = "FAIL";
    msg = "DB Zip file too small";
  }

  // Log the failed test
  if ( status !== "pass" ) {
    SANE = false;
    style = "bgRed.white.bold";
    errors.error("Fail file test: " + msg, undefined, AGENCY.id);
  }

  // Display test status
  log.raw([
    {
      "text": "    ... Checking files"
    },
    {
      "text": " " + status + " ",
      "chalk": style
    }
  ]);
}


/**
 * Run the sanity check specified by the count
 * @param count check counter
 * @private
 */
function _runChecks(count=0) {
  if ( count < CHECKS.length ) {
    _check(CHECKS[count], _nextCheck);
  }
  else {
    _finish();
  }

  function _nextCheck() {
    _runChecks(count+1);
  }
}

/**
 * Perform the specified sanity check
 * @param check Sanity Check
 * @param callback Check callback function
 * @private
 */
function _check(check, callback) {
  DB.get(check.select, function(err, row) {
    let status = "pass";
    let style = "bgGreen.black.bold";
    let msg = undefined;

    // Database Error
    if ( err ) {
      status = "ERROR";
      msg = err.message.toString();
    }

    // Perform the test
    else {
      let pass = check.test(row);
      if ( !pass ) {
        status = "FAIL";
        msg = "Test result: " + JSON.stringify(row);
      }
    }

    // Log the failed test
    if ( status !== "pass" ) {
      SANE = false;
      style = "bgRed.white.bold";
      errors.error("Fail DB test: " + check.name, msg, AGENCY.id);
    }

    // Display test status
    log.raw([
      {
        "text": "    ... Checking " + check.name
      },
      {
        "text": " " + status + " ",
        "chalk": style
      }
    ]);

    return callback();
  });
}


/**
 * Finish the sanity check process
 * @private
 */
function _finish() {
  FINAL_CALLBACK(SANE);
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


module.exports = sanityChecks;