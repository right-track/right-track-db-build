'use strict';

/**
 * ### Right Track Database Builder
 *
 * This module provides the main entry point into the Right Track Database
 * Build processes.  The `start()` function will start the update checks and
 * database compilation processes for the agency specified in the Database
 * Build Options ({@link Options}).
 * @module run
 */


const log = require('./helpers/log.js');
const options = require('./helpers/options.js');
const errors = require('./helpers/errors.js');
const update = require('./update/');
const compile = require('./compile/');

/**
 * The JS Date used to keep track of the start time
 * @type {Date}
 * @private
 */
let started = undefined;




// ==== MAIN ENTRY POINT ==== //

/**
 * Start the entire update and compilation process with the options
 * set in the {@link module:helpers/options|options} module
 */
function start() {
  started = new Date();
  errors.reset();

  // Make sure there is at least one agency configured
  if ( options.agencyCount() === 0 ) {
    log.error("ERROR: No agencies specified.");
    log.error("Specify the agencies to include with the --agency flag");
    process.exit(1);
  }

  _update();
}



// ==== UPDATE FUNCTIONS ==== //

/**
 * Start the update process
 * @private
 */
function _update() {
  update(_updateFinished);
}


/**
 * Callback function when update checks of all agencies are finished
 * @type {runCallback}
 * @private
 */
function _updateFinished() {

  // Count the number of agencies that need to compile
  let compileCount = 0;
  for ( let i = 0; i < options.agencyCount(); i++ ) {
    if ( options.agency(i).compile ) {
      compileCount++;
    }
  }


  log("------------------------------------------------");
  log("Agencies to Compile: " + compileCount);
  log("================================================");


  // Start the compile process, if needed
  if ( compileCount > 0 ) {
    _compile();
  }

  // No compilation needed...
  else {
    _finished();
  }

}



// ==== COMPILATION FUNCTIONS ==== //

/**
 * Start the compile process
 * @private
 */
function _compile() {
  compile(_compileFinished);
}


/**
 * Callback function when the compilation of all agencies is complete
 * @type {runCallback}
 * @private
 */
function _compileFinished() {
  log("================================================");
  _finished();
}




// ==== MAIN EXIT POINT ==== //

/**
 * Callback function when everything is finished
 * @type {runCallback}
 * @private
 */
function _finished() {
  let exit = 0;
  let finished = new Date();
  let delta = new Date(Math.abs(finished.getTime() - started.getTime()));

  // Print Update Stats
  log.info("UPDATE CHECK AND DATABASE COMPILATION FINISHED");
  log("------------------------------------------------");
  log("Finished: " + new Date());
  log("Run time: " + delta.getUTCMinutes() + " mins " + delta.getUTCSeconds() + " secs");
  log("================================================");

  // Print Warnings, if any
  let warnings = errors.getWarnings();
  if ( warnings.length > 0 ) {
    exit = 2;
    log.warning(warnings.length + " WARNING(S) LOGGED", false);
    for ( let i = 0; i < warnings.length; i++ ) {
      log.warning("--> " + warnings[i].message + " <" + warnings[i].agencyId + ">", false);
      if ( warnings[i].details ) {
        log.warning("    " + warnings[i].details, false);
      }
    }
  }

  // Print Errors, if any
  let errs = errors.getErrors();
  if ( errs.length > 0 ) {
    exit = 1;
    log.error(errs.length + " ERROR(S) LOGGED", false);
    for ( let i = 0; i < errs.length; i++ ) {
      log.error("--> " + errs[i].message + " <" + errs[i].agencyId + ">", false);
      if ( errs[i].details ) {
        log.error("    " + errs[i].details, false);
      }
    }
  }

  // Exit the Process
  process.exit(exit);
}



module.exports = start;