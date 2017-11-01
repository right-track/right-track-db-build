'use strict';

/**
 * ### Right Track Database Compiler
 *
 * This module starts the database compilation process.  It will run the
 * build scripts found in the `./gtfs/` and `./rt/` directories.
 * @module compile
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const errors = require('../helpers/errors.js');
const log = require('../helpers/log.js');
const options = require('../helpers/options.js');
const config = require('../../config.json');
const buildDirectory = require('./utils/buildDirectory.js');


/**
 * Final callback to return to the run script
 * @type {runCallback}
 */
let FINAL_CALLBACK = function() {};

// Agency Index Counter
let AGENCY = -1;





/**
 * Start the database compilation process
 * @param {runCallback} callback Callback function when the database compilation is complete
 */
function compile(callback) {
  log.info("RUNNING DATABASE COMPILATION SCRIPTS");
  log("------------------------------------------------");

  // Set properties
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
  if ( AGENCY < options.agencyCount() ) {
    if ( options.agency(AGENCY).compile ) {
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
  let agencyOptions = options.agency(AGENCY);

  // Start compiling agency...
  log.raw([
    {
      "text": "AGENCY:"
    },
    {
      "text": " " + agencyOptions.agency.id + " ",
      "chalk": "bgYellow.black"
    }
  ]);

  // Open Database
  let db = new sqlite3.Database(
    path.normalize(agencyOptions.agency.moduleDirectory + "/" + config.locations.db),
    function(err) {
      if ( err ) {
        let msg = "Could not open agency database";
        log.error("ERROR: " + msg);
        errors.error(msg, err.message, agencyOptions.agency.id);
        _finishAgency(db);
      }

      else {
        _build(db, agencyOptions);
      }
    }
  );

  // DB Error Handler
  db.on('error', function(err) {
    log.error("ERROR: " + err.message);
    errors.error(err.message, err.stack, agencyOptions.agency.id);
  });

}

/**
 * Build the Database tables by calling the build scripts in the gtfs and
 * rt directories
 * @param {Object} db The SQLite Database being built
 * @param {object} agencyOptions The Agency Build Options
 * @private
 */
function _build(db, agencyOptions) {

  let gtfsDirectory = path.normalize(__dirname + '/gtfs/');
  let rtDirectory = path.normalize(__dirname + '/rt/');

  buildDirectory(db, agencyOptions, gtfsDirectory, function() {
    buildDirectory(db, agencyOptions, rtDirectory, function() {
      _finishAgency(db, true);
    });
  });

}


/**
 * Callback function for when the agency is finished compiling
 * @param {object} db SQLite database that was built
 * @param {boolean} [compiled=false] Successful compilation flag
 * @private
 */
function _finishAgency(db, compiled=false) {

  // Close database connection
  db.close();

  // Flag the agency as compiled
  options.agency(AGENCY).compileComplete = compiled;

  // Continue to the next agency
  _startNextAgency();

}




/**
 * Callback function for when all agencies have finished compiling
 * @private
 */
function _finish() {
  FINAL_CALLBACK();
}



module.exports = compile;