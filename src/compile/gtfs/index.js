'use strict';

const fs = require('fs');
const path = require('path');
const config = require('../../../config.json');
const chalk = require('chalk');
const error = function(text) {console.error(chalk.bold.red(text))};


// Builders and Builder Index
let BUILDERS = [];
let RUNNING = -1;

// Build Properties
let DB = undefined;
let GTFS_DIR = undefined;
let CALLBACK = function() {};


/**
 * Build the GTFS Tables.  This will utilize all scripts in the ./compile/gtfs
 * directory to build the GTFS tables.
 * @param {sqlite3} db The SQLite Database being built
 * @param {object} agency The agency build options
 * @param {function} callback Callback function (with no arguments) called when
 * all GTFS builders have finished
 */
function buildGTFS(db, agency, callback) {
  console.log("--> Building GTFS Tables:");

  // Set properties
  RUNNING = -1;
  DB = db;
  GTFS_DIR = path.normalize(agency.agency.moduleDirectory + "/" + config.locations.gtfsDir);
  CALLBACK = callback;

  // Load Builders from same directory as this script
  fs.readdir(__dirname, function(err, files) {
    if ( err ) {
      error("ERROR: Could not load GTFS Builder scripts");
      _finish();
    }

    // Parse the files
    else {

      // Remove this file from list
      let index = files.indexOf(path.basename(__filename));
      files.splice(index, 1);

      // Load the builders
      for ( let i = 0; i < files.length; i++ ) {
        let run = require("./" + files[i]);
        if ( typeof run === 'function' ) {
          BUILDERS.push(
            {
              "file": files[i],
              "run": run
            }
          );
        }
      }

      // Start the GTFS Builders
      _start();
    }

  });

}


/**
 * Start each of the GTFS Builders
 * @private
 */
function _start() {
  RUNNING++;

  // Loop through each of the builders
  if ( RUNNING < BUILDERS.length ) {
    let builder = BUILDERS[RUNNING];
    console.log("    --> " + builder.file);
    builder.run(DB, GTFS_DIR, _start);
  }
  else {
    _finish();
  }

}


/**
 * Callback function for when all GTFS Builders are complete
 * @private
 */
function _finish() {
  CALLBACK();
}



module.exports = buildGTFS;