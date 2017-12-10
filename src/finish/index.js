'use strict';

/**
 * ### Right Track Database Finish Functions
 *
 * This module provides the wrap-up functions & sanity checks for an
 * agency database that has successfully compiled.
 * @module finish
 */


const path = require('path');
const sqlite3 = require('sqlite3');
const config = require('../../config.json');
const log = require('../helpers/log.js');
const options = require('../helpers/options.js');
const errors = require('../helpers/errors.js');
const sanityChecks = require('./sanityChecks.js');



/**
 * Final callback to return to the run script
 * @type {runCallback}
 * @private
 */
let FINAL_CALLBACK = function() {};

// Agency Index Counter
let AGENCY = -1;


/**
 * Start the database finishing process
 * @param {runCallback} callback Callback function when the finishing process
 * is complete.
 */
function finish(callback) {
  log.info("RUNNING DATABASE WRAP-UP SCRIPTS");

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
  // Move on to the next agency
  AGENCY++;

  // Continue with the next agency if there are more
  if ( AGENCY < options.agencyCount() ) {
    if ( options.agency(AGENCY).compileComplete ) {
      _setup();
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
 * Set up the database for the wrap-up procedures
 * @private
 */
function _setup() {

  // Get agency options
  let agencyOptions = options.agency(AGENCY);

  // Start compiling agency...
  log("------------------------------------------------");
  log.raw([
    {
      "text": "AGENCY:"
    },
    {
      "text": " " + agencyOptions.agency.id + " ",
      "chalk": "bgYellow.black"
    }
  ]);

  // Set up DB
  let dbPath = path.normalize(agencyOptions.agency.moduleDirectory + "/" + config.locations.db);
  let db = new sqlite3.Database(dbPath, function(err) {
    if ( err ) {
      let msg = "Could not open agency database";
      log.error("ERROR: " + msg);
      errors.error(msg, err.message, agencyOptions.agency.id);
      _finishAgency(db);
    }
    else {
      _wrapUp(db, agencyOptions);
    }
  });

  // DB Error Handler
  db.on('error', function(err) {
    log.error("ERROR: " + err.message);
    errors.error(err.message, err.stack, agencyOptions.agency.id);
  });

}


/**
 * Run the wrap-up procedures
 * @param db RightTrackDB
 * @param agencyOptions Agency Options
 * @private
 */
function _wrapUp(db, agencyOptions) {
  // Run Sanity Checks
  sanityChecks(db, agencyOptions, function(sane) {
    console.log("SANITY CHECK: " + sane);

    // Set sane flag
    agencyOptions.sane = sane;

    // Finish the agency
    _finishAgency(db);

  });

}


/**
 * Finish the Agency wrap-up
 * @param db RightTrackDB
 * @private
 */
function _finishAgency(db) {
  // Close database connection
  db.close();

  // Continue to the next agency
  _startNextAgency();
}


/**
 * Callback function for when all agencies have finished wrapping-up
 * @private
 */
function _finish() {
  FINAL_CALLBACK();
}



module.exports = finish;
