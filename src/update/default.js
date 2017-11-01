'use strict';

/**
 * ### Default Update Check
 *
 * The default update check is used when the Right Track Agency configuration
 * has the property: `build.updateURL`.
 * @module update/default
 */

const fs = require('fs');
const path = require('path');
const URL = require('url');
const http = require('http');
const Zip = require('adm-zip');
const config = require('../../config.json');
const log = require('../helpers/log.js');
const errors = require('../helpers/errors.js');


/**
 * Agency RightTrackAgency Class
 * @type {RightTrackAgency}
 * @private
 */
let AGENCY = undefined;

/**
 * Agency update callback function
 * @type {updateCallback}
 * @private
 */
let UPDATE_CALLBACK = function(requested, successful) {};


// Update flags
let UPDATE_REQUESTED = false;
let UPDATE_SUCCESSFUL = false;




/**
 * This is the built-in default agency update check.  This function is used
 * if the agency configuration contains the property `build.updateURL`.
 *
 * • First, it performs a `HEAD` request on the update URL to get the server's
 * `last-modified` header.  It will compare this date/time to the one saved
 * in the agency's gtfs directory in the `lastModified.txt` file.
 *
 * • If the `lastModified.txt` file is not found or has an older date/time
 * than the one provided in the server's `last-modified` header, it will
 * download the zip file and unzip the contents into the agency's gtfs directory.
 *
 * @param {Object} agencyOptions Agency Build Options
 * @param {updateCallback} callback callback function when update is complete
 * @type {updateFunction}
 */
function defaultUpdate(agencyOptions, callback) {
  log("--> Checking for GTFS data update...");

  // Set agency and callback functions
  AGENCY = agencyOptions.agency;
  UPDATE_CALLBACK = callback;

  // If an update is already flagged...
  if ( agencyOptions.update ) {
    UPDATE_REQUESTED = true;
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
  req.on('error', function(err) {
    let msg = "Could not make HEAD request to agency update url";
    log.error("ERROR: " + msg);
    log.error("Check the network settings and agency update url");
    errors.error(msg, err.stack, AGENCY.id);
    return _finish();
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
      return _finish();
    }

  }

  // Update the GTFS Files
  UPDATE_REQUESTED = true;
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
    let msg = "Could not download GTFS zip file for agency";
    log.error("ERROR: " + msg);
    errors.error(msg, err.stack, AGENCY.id);
    return _finish();
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
    UPDATE_SUCCESSFUL = true;
    return _finish();

  });
}


/**
 * Function to call when the update process if finished
 * @private
 */
function _finish() {
  UPDATE_CALLBACK(UPDATE_REQUESTED, UPDATE_SUCCESSFUL);
}




module.exports = defaultUpdate;