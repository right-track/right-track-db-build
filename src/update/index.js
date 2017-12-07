'use strict';

/**
 * ### GTFS Data Update Checker
 *
 * This module runs the agency update checks.  The agencies to check are set
 * in the build options and are returned from the {@link module:helpers/options|options}
 * module.  Depending on the Agency settings, this will either run the default
 * update function or the agency-specific update function.
 * @module update
 */

const fs = require('fs');
const path = require('path');
const config = require('../../config.json');
const errors = require('../helpers/errors.js');
const log = require('../helpers/log.js');
const options = require('../helpers/options.js');
const defaultUpdate = require('./default.js');


/**
 * Final callback to return to the run script
 * @type {runCallback}
 * @private
 */
let FINAL_CALLBACK = function() {};

// Agency counter
let AGENCY = 0;




/**
 * Start the database update check process.  This will check for a GTFS data
 * update for all agencies specified in the Database Build Options ({@link Options}).
 * If an update is present, the new data will be downloaded and unpacked into
 * the agency's GTFS directory.
 * @param {runCallback} callback Final callback when the update process is complete.
 */
function update(callback) {

  log.info("RUNNING AGENCY UPDATE CHECKS");
  log("------------------------------------------------");

  // Set final callback
  FINAL_CALLBACK = callback;

  // Start the first agency
  _startNextAgency();

}


/**
 * Function to call when starting the next agency in the list.  It will
 * start with an update check and then continue as necessary.
 * @private
 */
function _startNextAgency() {
  let agencyOptions = options.agency(AGENCY);

  // Get the agency options
  log.raw([
    {
      "text": "AGENCY:"
    },
    {
      "text": " " + agencyOptions.agency.id + " ",
      "chalk": "bgYellow.black"
    }
  ]);

  // Use default update check method...
  if ( _shouldUseDefaultUpdateMethod(agencyOptions) ) {
    log("--> Using default update script...");
    defaultUpdate(agencyOptions, _agencyUpdateComplete);
  }

  // Use an agency-specific update method
  else {
    let update = undefined;
    let exception = undefined;
    log("--> Using custom update script...");

    // Try to load the agency update script
    try {
      update = require(agencyOptions.agency.moduleDirectory + "/" + config.locations.updateScript);
    }
    catch(err) {
      exception = err;
    }

    // Run the update script
    if ( update !== undefined ) {
      update(agencyOptions, _agencyUpdateComplete);
    }
    else {
      let msg = "Could not run agency update script";
      log.error("ERROR: " + msg);
      errors.error(msg, exception.message, agencyOptions.agency.id);
      _agencyComplete();
    }

  }

}

/**
 * Function to call when an agency is finished with the update check
 * @param {boolean} requested Update requested flag
 * @param {boolean} successful Update successful flag
 * @type {updateCallback}
 * @private
 */
function _agencyUpdateComplete(requested, successful) {
  options.agency(AGENCY).update = requested;
  options.agency(AGENCY).updateComplete = successful;
  options.agency(AGENCY).published = new Date(
    fs.readFileSync(
      path.normalize(
        options.agency(AGENCY).agency.moduleDirectory + '/' + config.locations.published
      )
    ).toString()
  );

  let details = {};
  if ( requested && successful ) {
    options.agency(AGENCY).compile = true;

    details = {
      "text": " YES ",
      "chalk": "bgGreen.black.bold"
    };
  }
  else if ( requested && !successful ) {
    details = {
      "text": " UNSUCCESSFUL ",
      "chalk": "bgRed.white.bold"
    };
    errors.error("Agency Update Check Unsuccessful", undefined, options.agency(AGENCY).agency.id);
  }
  else {
    details = {
      "text": " No Update ",
      "chalk": "bgWhite.black.bold"
    };
  }

  // Log update status
  log.raw([
    {
      "text": "--> GTFS Data Update:"
    },
    details
  ]);

  // Complete the agency update check
  _agencyComplete();
}


/**
 * Function to call when an agency is completely finished
 * with the update check and database compilation, if necessary
 * @private
 */
function _agencyComplete() {
  AGENCY++;

  // Continue with the next agency if there are more
  if ( AGENCY < options.agencyCount() ) {
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
  FINAL_CALLBACK();
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



module.exports = update;