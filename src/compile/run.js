'use strict';

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const config = require('../../config.json');
const gtfs = require('./gtfs');
const chalk = require('chalk');
const log = console.log;
const info = function(text) {console.log(chalk.yellow(text))};
const error = function(text) {console.error(chalk.bold.red(text))};



// DB Build Options
let OPTIONS = undefined;

// Final callback when everything is finished
let FINAL_CALLBACK = function() {};

// Agency Index Counter
let CURRENT = -1;




/**
 * Start the database compilation process
 * @param {Options} options DB Build Options
 * @param {function} callback Final callback function
 */
function run(options, callback) {
  info("RUNNING DATABASE COMPILATION SCRIPTS");
  log("------------------------------------------------");

  // Set properties
  OPTIONS = options;
  FINAL_CALLBACK = callback;

  // Start with the first agency
  _startNextAgency();
}



/**
 * Start processing the next agency
 * @private
 */
function _startNextAgency() {
  // Move on to the next agency...
  CURRENT++;

  // Continue with the next agency if there are more
  if ( CURRENT < OPTIONS.agencies.length ) {
    if ( OPTIONS.agencies[CURRENT].update ) {
      _compile();
    }
    else {
      _startNextAgency();
    }
  }

  // All agencies are complete
  else {
    _finish();
  }
}



/**
 * Start with the Database compilation of the next agency.  This starts
 * compiling the GTFS tables.
 * @private
 */
function _compile() {
  let agency = OPTIONS.agencies[CURRENT];

  // Start compiling agency...
  log("AGENCY: " + chalk.bgYellow.black(" " + agency.agency.id + " "));

  // Open Database
  let db = new sqlite3.Database(
    path.normalize(agency.agency.moduleDirectory + "/" + config.locations.db),
    function(err) {
      if ( err ) {
        error("ERROR: Could not open database for agency <" + agency.agency.id + ">");
        OPTIONS.errors.push("Could not open database for agency <" + agency.agency.id + ">");
        _finishAgency(db);
      }

      else {
        _startGtfs(db, agency);
      }
    }
  );

  // DB Error Handler
  db.on('error', function(err) {
    error("ERROR: " + err.message + " <" + agency.agency.id + ">");
    OPTIONS.errors.push(err.message + " <" + agency.agency.id + ">");
  });

}




/**
 * Start compiling the GTFS Tables for the agency
 * @param db SQLite3 database to build
 * @param agency The agency build options
 * @private
 */
function _startGtfs(db, agency) {
  gtfs(db, agency, _gtfsFinished);
}

/**
 * Callback function for when the GTFS Tables have been built
 * @param db SQLite database that was built
 * @private
 */
function _gtfsFinished(db) {
  _finishAgency(db, true);
}




/**
 * Callback function for when the agency is finished compiling
 * @param db SQLite database that was built
 * @param compiled Successful compilation flag
 * @private
 */
function _finishAgency(db, compiled=false) {

  // Close database connection
  if ( db !== undefined ) {
    db.close();
  }

  // Flag the agency as compiled
  OPTIONS.agencies[CURRENT].compile = compiled;

  // Continue to the next agency
  _startNextAgency();
}




/**
 * Callback function for when all agencies have finished compiling
 * @private
 */
function _finish() {
  FINAL_CALLBACK(OPTIONS);
}



module.exports = run;