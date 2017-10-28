'use strict';

const path = require('path');
const config = require('../../../config.json');


// Builders and Builder Index
let BUILDERS = [
  require('./agency.js'),
  require('./calendar.js'),
  require('./calendar_dates.js'),
  require('./routes.js'),
  require('./stops.js'),
  require('./stop_times.js'),
  require('./trips.js')
];
let RUNNING = -1;

// Build Properties
let DB = undefined;
let GTFS_DIR = undefined;
let CALLBACK = function() {};




function run(db, agency, callback) {
  console.log("--> Building GTFS Tables:");

  // Set properties
  RUNNING = -1;
  DB = db;
  GTFS_DIR = path.normalize(agency.agency.moduleDirectory + "/" + config.locations.gtfsDir);
  CALLBACK = callback;

  // Start with the first builder
  _start();
}



function _start() {
  RUNNING++;

  // Loop through each of the builders
  if ( RUNNING < BUILDERS.length ) {
    BUILDERS[RUNNING](DB, GTFS_DIR, _start);
  }
  else {
    _finish();
  }

}



function _finish() {
  CALLBACK();
}



module.exports = run;