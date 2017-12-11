'use strict';

/**
 * ### GTFS Data Update Checker
 *
 * This module runs the agency update checks.  The agencies to check are set
 * in the build options and are returned from the {@link module:helpers/options|options}
 * module.  Depending on the Agency settings, this will either run the default
 * update function or the agency-specific update function.
 *
 * If the agency has a post-update script defined, this will be run after the
 * agency update script is complete, regardless if an update is requested.
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

  // Path to agency-specific update script
  let agencyUpdateScript = path.normalize(agencyOptions.agency.moduleDirectory + '/' + config.locations.scripts.update);

  // If agency-specific update script exists, use that to update...
  if ( fs.existsSync(agencyUpdateScript) ) {
    log("--> Using custom update script...");

    // Try to load the agency update script
    try {
      let update = require(agencyUpdateScript);
      update(agencyOptions, _agencyUpdateComplete);
    }
    catch(err) {
      let msg = "Could not run agency update script";
      log.error("ERROR: " + msg);
      errors.error(msg, err.message, agencyOptions.agency.id);
      _agencyUpdateComplete(false, false);
    }

  }

  // Use default update script
  else {
    log("--> Using default update script...");
    defaultUpdate(agencyOptions, _agencyUpdateComplete);
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

  // Set agency option properties
  options.agency(AGENCY).update = requested;
  options.agency(AGENCY).updateComplete = successful;
  options.agency(AGENCY).published = new Date(
    fs.readFileSync(
      path.normalize(
        options.agency(AGENCY).agency.moduleDirectory + '/' + config.locations.files.published
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

  // Check for a post-update script
  _agencyPostUpdate();

}


/**
 * Run the agency post-update script, if present
 * @private
 */
function _agencyPostUpdate() {
  let postUpdateScript = path.normalize(options.agency(AGENCY).agency.moduleDirectory + '/' + config.locations.scripts.postUpdate);

  // post update script exists
  if ( fs.existsSync(postUpdateScript) ) {
    log("--> Running agency post-update script...");
    let postUpdate = require(postUpdateScript);
    postUpdate(options.agency(AGENCY), _agencyComplete);
  }

  // no post update script
  else {
    _agencyComplete();
  }
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



module.exports = update;