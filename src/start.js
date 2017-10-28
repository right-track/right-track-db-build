'use strict';

/**
 * Right Track Database Builder: start GTFS update and database compilation
 * @module /start
 */


const update = require('./update/');
const compile = require('./compile/');
const chalk = require('chalk');
const log = console.log;
const info = function(text) {console.log(chalk.yellow(text))};
const error = function(text) {console.error(chalk.bold.red(text))};



// Build Options
let OPTIONS = undefined;

// Start time (when the file is required)
let started = new Date();




/**
 * Start the entire update and compilation process with the provided options
 * @param {Options} options DB Build Options
 */
function start(options) {
  OPTIONS = options;
  //_update();                  // TODO: uncomment
  _compile();   // TODO: remove
}




/**
 * Start the update process
 * @private
 */
function _update() {
  update(OPTIONS, _updateFinished);
}



/**
 * Callback function when update checks of all agencies are finished
 * @param {Options} options The Build Options returned from the update script
 * @private
 */
function _updateFinished(options) {
  OPTIONS = options;

  // Count the number of agencies that need to compile
  let compileCount = 0;
  for ( let i = 0; i < OPTIONS.agencies.length; i++ ) {
    if ( OPTIONS.agencies[i].update ) {
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


/**
 * Start the compile process
 * @private
 */
function _compile() {
  compile(OPTIONS, _compileFinished);
}


/**
 * Callback function when the compilation of all agencies is complete
 * @param {Options} options The Build Options returned from the compile script
 * @private
 */
function _compileFinished(options) {
  OPTIONS = options;

  log("================================================");

  _finished();
}


/**
 * Callback function when everything is finished
 * @private
 */
function _finished() {
  let exit = 0;
  let finished = new Date();
  let delta = new Date(Math.abs(finished.getTime() - started.getTime()));

  info("UPDATE CHECK AND DATABASE COMPILATION FINISHED");
  log("------------------------------------------------");
  log("Finished: " + new Date());
  log("Run time: " + delta.getUTCMinutes() + " mins " + delta.getUTCSeconds() + " secs");
  log("================================================");

  if ( OPTIONS.errors.length > 0 ) {
    exit = 1;
    error(OPTIONS.errors.length + " ERROR(S) LOGGED");
    log("------------------------------------------------");
    for ( let i = 0; i < OPTIONS.errors.length; i++ ) {
      error("--> " + OPTIONS.errors[i]);
    }
  }

  process.exit(exit);
}



module.exports = start;