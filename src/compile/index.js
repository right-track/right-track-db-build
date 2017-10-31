'use strict';

/**
 * Right Track Database Builder: start database compilation
 * @module /compile
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const config = require('../../config.json');
const buildDirectory = require('./utils/buildDirectory.js');
const chalk = require('chalk');
const log = console.log;
const info = function(text) {console.log(chalk.yellow(text))};
const error = function(text) {console.error(chalk.bold.red(text))};


// DB Build Options
let OPTIONS = undefined;

// Final callback when everything is finished
let FINAL_CALLBACK = function() {};

// Agency Index Counter
let AGENCY = -1;





/**
 * Start the database compilation process
 * @param {Options} options DB Build Options
 * @param {mainCallback} callback Callback function when the database compilation is complete
 */
function compile(options, callback) {
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
  AGENCY++;

  // Continue with the next agency if there are more
  if ( AGENCY < OPTIONS.agencies.length ) {
    if ( OPTIONS.agencies[AGENCY].update ) {
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
  let agency = OPTIONS.agencies[AGENCY];

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
        _build(db, agency);
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
 * Build the Database tables by calling the build scripts in the
 * gtfs and rt directories
 * @param {sqlite3} db The SQLite Database being built
 * @param {object} agency The Agency Build Options
 * @private
 */
function _build(db, agency) {

  let gtfsDirectory = path.normalize(__dirname + '/gtfs/');
  let rtDirectory = path.normalize(__dirname + '/rt/');

  buildDirectory(db, agency, gtfsDirectory, function() {
    buildDirectory(db, agency, rtDirectory, function() {
      _finishAgency(db, true);
    });
  });

}


/**
 * Callback function for when the agency is finished compiling
 * @param db SQLite database that was built
 * @param compiled Successful compilation flag
 * @private
 */
function _finishAgency(db, compiled=false) {

  // Close database connection
  db.close();

  // Flag the agency as compiled
  OPTIONS.agencies[AGENCY].compile = compiled;

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



module.exports = compile;