'use strict';

/**
 * ### Right Track Database Finish Functions
 *
 * This module provides the wrap-up functions & sanity checks for an
 * agency database that has successfully compiled.
 * @module finish
 */


const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const sqlite3 = require('sqlite3');
const config = require('../../config.json');
const log = require('../helpers/log.js');
const options = require('../helpers/options.js');
const errors = require('../helpers/errors.js');
const sanityChecks = require('./sanityChecks.js');



/**
 * Final callback to return to the run script
 * @type {runCallback}
 * @private
 */
let FINAL_CALLBACK = function() {};

// Agency Index Counter
let AGENCY = -1;


/**
 * Start the database finishing process
 * @param {runCallback} callback Callback function when the finishing process
 * is complete.
 */
function finish(callback) {
  log.info("RUNNING DATABASE WRAP-UP SCRIPTS");

  // Set properties
  FINAL_CALLBACK = callback;

  // Start with the first agency
  _startNextAgency();
}


/**
 * Start processing the next agency
 * @private
 */
function _startNextAgency() {
  // Move on to the next agency
  AGENCY++;

  // Continue with the next agency if there are more
  if ( AGENCY < options.agencyCount() ) {
    if ( options.agency(AGENCY).compileComplete ) {
      _setup();
    }
    else {
      _startNextAgency();
    }
  }

  // All agencies are complete
  else {
    _finish();
  }
}


/**
 * Set up the database for the wrap-up procedures
 * Start running the wrap-up procedures once setup
 * @private
 */
function _setup() {

  // Get agency options
  let agencyOptions = options.agency(AGENCY);

  // Start compiling agency...
  log("------------------------------------------------");
  log.raw([
    {
      "text": "AGENCY:"
    },
    {
      "text": " " + agencyOptions.agency.id + " ",
      "chalk": "bgYellow.black"
    }
  ]);

  // Set up DB
  let dbPath = path.normalize(agencyOptions.agency.moduleDirectory + "/" + config.locations.files.db);
  let db = new sqlite3.Database(dbPath, function(err) {
    if ( err ) {
      let msg = "Could not open agency database";
      log.error("ERROR: " + msg);
      errors.error(msg, err.message, agencyOptions.agency.id);
      return _finishAgency(db);
    }
    else {
      return _run(db, agencyOptions);
    }
  });

  // DB Error Handler
  db.on('error', function(err) {
    log.error("ERROR: " + err.message);
    errors.error(err.message, err.stack, agencyOptions.agency.id);
  });

}


/**
 * Run the wrap-up procedures
 * @param db RightTrackDB
 * @param agencyOptions Agency Options
 * @private
 */
function _run(db, agencyOptions) {

  // Create Zip File
  _zip(agencyOptions, function() {

    // Run Sanity Checks
    sanityChecks(db, agencyOptions, function(sane) {

      // Set sane flag
      agencyOptions.sane = sane;

      // Install database to agency modules, if sane
      if ( sane ) {
        _install(db, agencyOptions);
      }

      // Finish the agency
      else {
        _finishAgency(db);
      }

    });

  });

}


/**
 * Create a zip archive of the database file
 * @param agencyOptions Agency Options
 * @param callback Callback function
 * @private
 */
function _zip(agencyOptions, callback) {
  log("--> Creating zip archive");

  // Database Paths
  let dbPath = path.normalize(agencyOptions.agency.moduleDirectory + '/' + config.locations.files.db);
  let zipPath = path.normalize(agencyOptions.agency.moduleDirectory + '/' + config.locations.files.dbZip);

  // Create Zip
  let zip = fs.createWriteStream(zipPath);
  let archive = archiver('zip', {zib: {level: 9}});

  // Zip Error Handler
  zip.on('error', function(err) {
    let msg = "Could not create zip archive of database";
    log.error("ERROR: " + msg);
    errors.error(msg, err.stack, agencyOptions.agency.id);
    return callback();
  });

  // Zip Finished
  zip.on('close', function() {
    return callback();
  });

  // Add file
  archive.pipe(zip);
  archive.file(dbPath, {name: 'database.db'});
  archive.finalize();

}


/**
 * Install the Database files into the agency module
 * @param db RightTrackDB
 * @param agencyOptions Agency Options
 * @private
 */
function _install(db, agencyOptions) {
  log("--> Installing Database");

  // Set source file paths
  let dbPath = path.normalize(agencyOptions.agency.moduleDirectory + '/' + config.locations.files.db);
  let dbZipPath = path.normalize(agencyOptions.agency.moduleDirectory + '/' + config.locations.files.dbZip);
  let versionPath = path.normalize(agencyOptions.agency.moduleDirectory + '/' + config.locations.files.version);

  // Set destination file paths
  let latestDir = path.normalize(path.dirname(agencyOptions.agency.config.db.location));
  let archiveDir = path.normalize(agencyOptions.agency.config.db.archiveDir);
  let latestDbPath = path.normalize(latestDir + '/' + path.basename(dbPath));
  let latestDbZipPath = path.normalize(latestDir + '/' + path.basename(dbZipPath));
  let latestVersionPath = path.normalize(latestDir + '/' + path.basename(versionPath));
  let archiveDbPath = path.normalize(archiveDir + '/' + agencyOptions.version + ".zip");

  // Set paths to copy
  let paths = [];
  paths.push({source: dbPath, destination: latestDbPath});
  paths.push({source: dbZipPath, destination: latestDbZipPath});
  paths.push({source: versionPath, destination: latestVersionPath});
  paths.push({source: dbZipPath, destination: archiveDbPath});

  // Copy the files
  _copyFiles(paths, 0, function() {

    // Finish the Agency when copied
    _finishAgency(db);

  });

}


/**
 * Copy the set of files
 * @param {Object[]} paths List of files to copy
 * @param {string} paths.source Source file path
 * @param {string} paths.destination Destination file path
 * @param {int} count File counter
 * @param callback Callback function
 * @private
 */
function _copyFiles(paths, count, callback) {
  if ( count < paths.length ) {
    _copy(
      paths[count].source,
      paths[count].destination,
      function(err) {
        if ( err ) {
          let msg = "Could not copy " + paths[count].source + " --> " + paths[count].destination;
          log.error("ERROR: " + msg);
          errors.error(msg, err.stack, options.agency(AGENCY).agency.id);
          _finish();
        }
        else {
          _next();
        }
      }
    );
  }
  else {
    _finish();
  }

  function _next() {
    return _copyFiles(paths, count+1, callback);
  }
  function _finish() {
    return callback();
  }
}


/**
 * Copy the source file to the destination file
 * @param source Source file path
 * @param destination Destination file path
 * @param callback Callback function(err)
 * @private
 */
function _copy(source, destination, callback) {
  let s = fs.createReadStream(source);
  s.on('error', function(err) {
    return callback(err);
  });

  let d = fs.createWriteStream(destination);
  d.on('close', function() {
    return callback();
  });
  d.on('error', function(err) {
    return callback(err);
  });

  s.pipe(d);
}


/**
 * Finish the Agency wrap-up
 * @param db RightTrackDB
 * @private
 */
function _finishAgency(db) {
  // Close database connection
  db.close();

  // Continue to the next agency
  _startNextAgency();
}


/**
 * Callback function for when all agencies have finished wrapping-up
 * @private
 */
function _finish() {

  // Check for post-install script
  if ( options.get().post ) {
    log("================================================");
    log.info("RUNNING POST-INSTALL SCRIPT");
    log("Location: " + options.get().post);
    log("------------------------------------------------");

    // Run the post-install script
    try {
      let postInstall = require(options.get().post);
      postInstall(options.get(), errors.getExceptions(), function() {
        return FINAL_CALLBACK();
      });
    }

    // Catch errors
    catch(err) {
      let msg = "Could not run post-install script";
      log.error("ERROR: " + msg);
      errors.error(msg, err.stack, undefined);
      return FINAL_CALLBACK();
    }

  }

  // No post-install script specified...
  else {
    return FINAL_CALLBACK();
  }

}



module.exports = finish;
