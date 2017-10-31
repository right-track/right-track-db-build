'use strict';

/**
 * #### Database Build Directory
 *
 * Process the build table scripts found in a specified directory.
 *
 * This will run all .js files in the specified directory that export
 * a `buildTable` function.
 * @module /compile/utils/buildDirectory
 */

const fs = require('fs');
const path = require('path');


/**
 * Run all of the build table scripts in the specified directory.  This will find
 * all .js files that export a `buildTable` function and run the scripts in
 * alphabetical order of the scripts' filenames.
 * @param {sqlite3} db The SQLite database being built
 * @param {Object} agency The Agency Build Options
 * @param {string} directory The path to the directory containing the build scripts
 * @param {function} callback Callback function() called when all build scripts have finished
 */
function buildDirectory(db, agency, directory, callback) {
  console.log("--> Processing Build Scripts From Directory: " + path.basename(directory));

  // Get the builders in the directory
  let builders = _getBuildFunctions(directory);

  // Start running the builders
  _runBuilder(0, builders, db, agency, callback);

}


/**
 * Run the build script specified by the index from the list of builders.  When
 * all build scripts have been run, call the callback function.
 * @param {int} index Index of build script to run
 * @param {object[]} builders List of Builders
 * @param {sqlite3} db The SQLite Database being built
 * @param {Object} agency Agency Build Options
 * @param {function} callback Callback function() called when all build scripts have finished
 * @private
 */
function _runBuilder(index, builders, db, agency, callback) {

  // Run the builder
  if ( index < builders.length ) {
    let builder = builders[index];
    console.log("    --> " + builder.file);

    // Run the build script
    builder.build(db, agency, function() {

      // Start the Next Builder when this one is finished
      _runBuilder(index+1, builders, db, agency, callback);

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