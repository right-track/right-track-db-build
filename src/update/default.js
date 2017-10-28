'use strict';

const fs = require('fs');
const path = require('path');
const URL = require('url');
const http = require('http');
const Zip = require('adm-zip');
const config = require('../../config.json');
const log = console.log;


// Agency Properties and callback functions
let AGENCY = undefined;
let UPDATE_CALLBACK = function() {};


// List of Errors
let ERRORS = [];



/**
 * Check to see if we need to update the GTFS files and rebuild the database
 * @param {boolean} force True to force the update of GTFS files
 * @param {RightTrackAgency} agency the Right Track Agency to update
 * @param {function} updateCallback callback function accepting update boolean
 */
function update(force, agency, updateCallback) {
  log("--> Checking for GTFS data update...");

  // Set agency and callback functions
  AGENCY = agency;
  UPDATE_CALLBACK = updateCallback;
  ERRORS = [];

  // If we are forced to update...
  if ( force ) {
    return _updateFiles();
  }

  // Check the last update of the server
  return _checkLastUpdate();

}


/**
 * Check the remote source server if an update is available
 * @private
 */
function _checkLastUpdate() {
  // Parse the URL
  let url = URL.parse(AGENCY.config.build.updateURL);

  // Set request options
  let options = {
    method: 'HEAD',
    host: url.host,
    path: url.path
  };

  // Make the request
  let req = http.request(options, function(res) {
    let headers = res.headers;
    let serverLastModified = new Date(headers['last-modified']);
    _compareLastUpdate(serverLastModified);
  });
  req.end();
}



/**
 * Compare the Server's last modified date with that saved on the local machine
 * @param {Date} server The Last Modified Date from the Server
 * @private
 */
function _compareLastUpdate(server) {
  let lastModifiedFile = path.normalize(AGENCY.moduleDirectory + '/' + config.locations.lastModified);

  // Check if our last modified file exists
  if ( fs.existsSync(lastModifiedFile) ) {

    let ts = fs.readFileSync(lastModifiedFile).toString().trim();
    let local = new Date(ts);

    log("    server: " + server);
    log("    local: " + local);

    // No update required...
    if ( server <= local ) {
      return _finish(false);
    }

  }

  // Update the GTFS Files
  return _updateFiles();
}


/**
 * Download the GTFS files from the source server
 * @private
 */
function _updateFiles() {
  log("--> Updating GTFS Files...");
  _downloadZip();
}

/**
 * Download the GTFS Zip File
 * @private
 */
function _downloadZip() {
  let gtfsZip = path.normalize(AGENCY.moduleDirectory + '/' + config.locations.gtfsZip);

  // Set output file
  let zip = fs.createWriteStream(gtfsZip);

  // Make the request
  http.get(AGENCY.config.build.updateURL, function(response) {
    let serverLastModified = response.headers['last-modified'];
    response.pipe(zip);

    zip.on('finish', function() {
      zip.close(_unzipFiles(serverLastModified));
    });
  }).on('error', function(err) {
    error("ERROR: Could not download GTFS zip file for agency <" + AGENCY.id + ">");
    error(err.message);
    ERRORS.push("Could not download GTFS zip file for agency <" + AGENCY.id + ">");
    return _finish(false);
  });

}

/**
 * Unzip the GTFS Zip file into the GTFS Directory
 * @param {Date} serverLastModified The last modified date of the server's files
 * @private
 */
function _unzipFiles(serverLastModified) {
  let gtfsDir = path.normalize(AGENCY.moduleDirectory + '/' + config.locations.gtfsDir);
  let gtfsZip = path.normalize(AGENCY.moduleDirectory + '/' + config.locations.gtfsZip);
  let lastModifiedFile = path.normalize(AGENCY.moduleDirectory + config.locations.lastModified);

  // Extract the files
  let zip = new Zip(gtfsZip);
  zip.extractAllTo(gtfsDir, true);

  // Remove zip file
  fs.unlink(gtfsZip, function() {});

  // Update the lastModified file...
  fs.writeFile(lastModifiedFile, serverLastModified, function() {

    // Return with update flag
    return _finish(true);

  });
}


/**
 * Function to call when the update process if finished
 * @param {boolean} update Update requested flag
 * @private
 */
function _finish(update) {
  UPDATE_CALLBACK(ERRORS, update);
}




module.exports = update;