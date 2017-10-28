'use strict';

const defaultUpdate = require('./default.js');
const chalk = require('chalk');
const log = console.log;
const info = function(text) {console.log(chalk.yellow(text))};
const error = function(text) {console.error(chalk.bold.red(text))};



// Build Options
let OPTIONS = undefined;

// Final callback function
let FINAL_CALLBACK = function() {};

// Agency counter
let CURRENT = 0;




/**
 * Start the database update check and compilation process
 * @param {object} options The parsed CLI Options
 * @param {function} callback Final callback when everything is finished
 */
function run(options, callback) {

  info("RUNNING AGENCY UPDATE CHECKS");
  log("------------------------------------------------");

  // Set properties
  OPTIONS = options;
  FINAL_CALLBACK = callback;

  // Make sure there is at least one agency provided
  if ( OPTIONS.agencies.length === 0 ) {
    error("ERROR: No agencies specified.");
    error("Specify the agencies to include with the --agency flag");
    OPTIONS.errors.push("No agencies specified");
    _finish()
  }

  // Start the first agency
  else {
    _startNextAgency();
  }

}


/**
 * Function to call when starting the next agency in the list.  It will
 * start with an update check and then continue as necessary.
 * @private
 */
function _startNextAgency() {

  // Get the agency options
  let agency = OPTIONS.agencies[CURRENT];
  log("AGENCY: " + chalk.bgYellow.black(" " + agency.agency.id + " "));

  // Use default update check method...
  if ( _shouldUseDefaultUpdateMethod(agency) ) {
    log("--> Using default update script...");
    defaultUpdate(OPTIONS.force, agency.agency, _agencyUpdateComplete);
  }

  // Use an agency-specific update method
  else {

    // Look for the agency's update script
    try {
      log("--> Using custom update script...");
      let update = require(agency.require + "/db-build/src/update.js");
      update(OPTIONS.force, _agencyUpdateComplete);
    }

    // Agency does not have update script...
    catch(exception) {
      error("ERROR: could not run agency update script");
      OPTIONS.errors.push("Could not run agency update script <" + agency.agency.id + ">");
      _agencyComplete();
    }

  }

}

/**
 * Function to call when an agency is finished with the update check
 * @param {string[]} errors List of errors encountered while updating
 * @param {boolean} update True when a database update is requested
 * @private
 */
function _agencyUpdateComplete(errors, update) {
  OPTIONS.errors = OPTIONS.errors.concat(errors);
  OPTIONS.agencies[CURRENT].update = update;

  if ( update ) {
    log("--> DB Update Requested: " + chalk.bgGreen.black.bold(" YES "));
  }
  else {
    log("--> DB Update Requested: " + chalk.bgRed.white.bold(" NO "));
  }

  _agencyComplete();
}


/**
 * Function to call when an agency is completely finished
 * with the update check and database compilation, if necessary
 * @private
 */
function _agencyComplete() {
  CURRENT++;

  // Continue with the next agency if there are more
  if ( CURRENT < OPTIONS.agencies.length ) {
    log("------------------------------------------------");
    _startNextAgency();
  }

  // All agencies are complete
  else {
    _finish();
  }

}


/**
 * Callback function for when all agencies have run update checks
 * @private
 */
function _finish() {
  FINAL_CALLBACK(OPTIONS);
}





/**
 * Check if the agency has build.updateURL defined in it's config
 * @param {object} agency Agency options
 * @returns {boolean}
 * @private
 */
function _shouldUseDefaultUpdateMethod(agency) {
  if ( agency !== undefined ) {
    if ( agency.agency !== undefined ) {
      if ( agency.agency.config !== undefined ) {
        if ( agency.agency.config.build !== undefined ) {
          if ( agency.agency.config.build.updateURL !== undefined ) {
            return true;
          }
        }
      }
    }
  }
  return false;
}



module.exports = run;