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


const fs = require('fs');
const path = require('path');
const log = require('./helpers/log.js');
const options = require('./helpers/options.js');
const errors = require('./helpers/errors.js');
const update = require('./update/');
const compile = require('./compile/');
const finish = require('./finish/');
const config = require('../config.json');


let CALLBACK = undefined;



// ==== MAIN ENTRY POINT ==== //

/**
 * Start the entire update and compilation process with the options
 * set in the {@link module:helpers/options|options} module
 * @param {function} callback Callback function
 */
function start(callback) {
  CALLBACK = callback;
  options.set().started = new Date();

  // Make sure there is at least one agency configured
  if ( options.agencyCount() === 0 ) {
    log.error("ERROR: No agencies specified.");
    log.error("Specify the agencies to include with the --agency flag");
    process.exit(1);
  }

  // Start the setup process
  _setup();
}



// ==== SETUP FUNCTIONS ==== //

/**
 * Setup the update/compilation process
 * Make sure all agency build directories are present
 * @private
 */
function _setup() {

  // Parse each agency
  for ( let i = 0; i < options.agencyCount(); i++ ) {
    let agency = options.agency(i);

    // Make sure db build directories are present
    let directories = config.locations.directories;
    for ( let name in directories ) {
      if ( directories.hasOwnProperty(name) ) {
        let directory = directories[name];
        let directoryPath = path.normalize(agency.agency.moduleDirectory + '/' + directory);

        // Try to create the directory, if it doesn't exist
        if ( !fs.existsSync(directoryPath) ) {
          fs.mkdirSync(directoryPath);
          if ( !fs.existsSync(directoryPath) ) {
            errors.error("Could not setup agency for db build", "Could not create directory: " + directoryPath);
            return _finished();
          }
        }
      }
    }

  }

  // Start the Update Process
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
  compile(function() {
    log("================================================");
    _finish();
  });
}


// ==== FINISH FUNCTIONS ==== //

/**
 * Start the finish process
 * @private
 */
function _finish() {
  finish(function() {
    log("================================================");
    _finished();
  });
}




// ==== MAIN EXIT POINT ==== //

/**
 * Callback function when everything is finished
 * @type {runCallback}
 * @private
 */
function _finished() {
  options.set().finished = new Date();
  if ( CALLBACK ) {
    return CALLBACK();
  }
}



module.exports = start;