'use strict';

/**
 * #### Database Build Directory
 *
 * Process the build table scripts found in a specified directory.
 *
 * This will run all .js files in the specified directory that export
 * a `buildTable` function.
 * @module compile/utils/buildDirectory
 */

const fs = require('fs');
const path = require('path');
const log = require('../../helpers/log.js');
const errors = require('../../helpers/errors.js');


/**
 * Run all of the build table scripts in the specified directory.  This will find
 * all .js files that export a `buildTable` function and run the scripts in
 * alphabetical order of the scripts' filenames.
 * @param {Object} db The SQLite database being built
 * @param {Object} agencyOptions The Agency Build Options
 * @param {string} directory The path to the directory containing the build scripts
 * @param {function} callback Callback function() called when all build scripts have finished
 */
function buildDirectory(db, agencyOptions, directory, callback) {
  log("--> Processing Build Scripts From Directory: " + path.basename(directory));

  // Check to make sure directory exists
  if ( !fs.existsSync(directory) ) {
    log.warning("        WARNING: Source directory does not exist (" + directory + ")");
    errors.warning("Source directory does not exist", "Directory: " + directory, agencyOptions.agency.id);
    return callback();
  }

  // Get the builders in the directory
  let builders = _getBuildFunctions(directory);

  // Start running the builders
  _runBuilder(0, builders, db, agencyOptions, callback);

}


/**
 * Run the build script specified by the index from the list of builders.  When
 * all build scripts have been run, call the callback function.
 * @param {int} index Index of build script to run
 * @param {object[]} builders List of Builders
 * @param {object} db The SQLite Database being built
 * @param {object} agencyOptions Agency Build Options
 * @param {function} callback Callback function() called when all build scripts have finished
 * @private
 */
function _runBuilder(index, builders, db, agencyOptions, callback) {

  // Run the builder
  if ( index < builders.length ) {
    let builder = builders[index];
    log("    --> " + builder.file);

    // Run the build script
    builder.build(db, agencyOptions, function() {

      // Start the Next Builder when this one is finished
      _runBuilder(index+1, builders, db, agencyOptions, callback);

    });

  }

  // Builders complete, return with the callback
  else {
    callback()
  }

}


/**
 * Parse the directory for all build table functions.  This looks for files
 * in the specified directory that export a function named `buildTable` and
 * returns a list of all builders where a builder is:
 * object{"file": filename, "build": buildTable() function}
 * @param {string} directory Path to directory to search
 * @returns {Object[]} List of Builders in directory
 * @private
 */
function _getBuildFunctions(directory) {

  // List of builders to return
  let rtn = [];

  // Read all files in directory
  let files = fs.readdirSync(directory);

  // Parse each of the files
  for ( let i = 0; i < files.length; i++ ) {
    let file = files[i];
    let req = require(directory + "/" + file);

    // Add builder if file exports a function named 'buildTable'
    if ( typeof req === 'function' && req.name === 'buildTable' ) {
      rtn.push({
        "file": path.basename(file),
        "build": req
      });
    }
  }

  // Return list of builders
  return rtn;

}



module.exports = buildDirectory;