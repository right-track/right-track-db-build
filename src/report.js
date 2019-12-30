#!/usr/bin/env node
'use strict';

/**
 * ### Right Track Database Builder Report
 *
 * This module will create a report on the agencies that have 
 * been updated and any warnings and/or errors that ocurred 
 * during the build process.  If an email address is provided 
 * in the options, the report will be sent in an email.
 * @module report
 */


const props = require('../package.json');
const log = require('./helpers/log.js');
const options = require('./helpers/options.js');
const errors = require('./helpers/errors.js');


/**
 * Print status of DB update and compilation process and 
 * generate an email report, if requested
 */
function report() {
  
  // DB Update and Compilation FINISHED
  if ( options.get().started && options.get().finished ) {

    // Calculate run time
    let delta = new Date(Math.abs(options.get().finished.getTime() - options.get().started.getTime()));

    // Print Update Stats
    log.info("UPDATE CHECK AND DATABASE COMPILATION FINISHED");
    log("------------------------------------------------");
    log("Finished: " + options.get().finished);
    log("Run time: " + delta.getUTCMinutes() + " mins " + delta.getUTCSeconds() + " secs");
    log("================================================");

  }

  // DB Update and Compilation DID NOT FINISH
  else {
    log("------------------------------------------------");
    log.error("ERROR: UPDATE CHECK AND DATABASE COMPILATION DID NOT FINISH");
    log("================================================");
  }

  // Print Warnings, if any
  let warnings = errors.getWarnings();
  if ( warnings.length > 0 ) {
    log.warning(warnings.length + " WARNING(S) LOGGED", false);
    for ( let i = 0; i < warnings.length; i++ ) {
      let msg = "--> " + warnings[i].message;
      if ( warnings[i].agencyId ) {
        msg += " <" + warnings[i].agencyId + ">";
      } 
      log.warning(msg, false);
      if ( warnings[i].details ) {
        log("    " + warnings[i].details);
      }
    }
  }

  // Print Errors, if any
  let errs = errors.getErrors();
  if ( errs.length > 0 ) {
    log.error(errs.length + " ERROR(S) LOGGED", false);
    for ( let i = 0; i < errs.length; i++ ) {
      let msg = "--> " + errs[i].message;
      if ( errs[i].agencyId ) {
        msg += " <" + errs[i].agencyId + ">";
      }
      log.error(msg, false);
      if ( errs[i].details ) {
        log("    " + errs[i].details);
      }
    }
  }

  // Generate email, if requested
  if ( options.get().email ) {
    let html = "<h2>" + props.description + ": Status Report</h2>";
    html += "<h3><strong>Version:</strong> " + props.version + "</h3>";
  }
}


 module.exports = report;