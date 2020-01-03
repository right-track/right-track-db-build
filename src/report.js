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

const os = require('os');
const nodemailer = require('nodemailer');
const h2t = require('html-to-text');


/**
 * Print status of DB update and compilation process and 
 * generate an email report, if requested
 */
function report() {
  let opts = options.get();

  // DB Update and Compilation FINISHED
  if ( opts.started && opts.finished ) {

    // Calculate delta
    options.set().delta = new Date(Math.abs(opts.finished.getTime() - opts.started.getTime()));

    // Print Update Stats
    log.info("UPDATE CHECK AND DATABASE COMPILATION FINISHED");
    log("------------------------------------------------");
    log("Finished: " + opts.finished);
    log("Run time: " + opts.delta.getUTCMinutes() + " mins " + opts.delta.getUTCSeconds() + " secs");
    log("================================================");

  }

  // DB Update and Compilation DID NOT FINISH
  else {
    log("------------------------------------------------");
    log.error("ERROR: UPDATE CHECK AND DATABASE COMPILATION DID NOT FINISH");
    log("================================================");
  }

  
  // Print exceptions, if any
  if ( errors.getExceptionCount() > 0 ) {
    _exceptions();
  }

  // Generate email, if requested
  if ( opts.email ) {
    _email();
  }

}


/**
 * Print any warnings and errors to the log
 * @private
 */
function _exceptions() {
  let warnings = errors.getWarnings();
  let errs = errors.getErrors();

  // Print Warnings, if any
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
  if ( errs.length > 0 ) {
    log.error(errs.length + " ERROR(S) LOGGED", false);
    for ( let i = 0; i < errs.length; i++ ) {
      let msg = "--> " + errs[i].message;
      if ( errs[i].agencyId ) {
        msg += " <" + errs[i].agencyId + ">";
      }
      log(msg);
      if ( errs[i].details ) {
        log("    " + errs[i].details);
      }
    }
  }
}




/**
* Generate and send the report email, if an agency was updated and/or compiled 
* or if they were any exceptions during the database build process
* @private
*/
function _email() {
  let send_email = false;
  let opts = options.get();

  // Build Email Body
  let html = "<h1>" + props.description + ": Status Report</h1>";
  html += "<strong>Version:</strong> " + props.version + "<br />";
  if ( opts.started ) html += "<strong>Started:</strong> " + opts.started + "<br />";
  if ( opts.finished ) html += "<strong>Finished:</strong> " + opts.finished + "<br />"; 
  if ( opts.delta ) html += "<strong>Run Time:</strong> " + opts.delta.getUTCMinutes() + " mins " + opts.delta.getUTCSeconds() + " secs<br />";
  html += "<br /><hr />";

  // Add Exceptions
  if ( errors.getExceptionCount() > 0 ) {
    send_email = true;
    html += "<h2>Exceptions</h2>";
    if ( errors.getErrorCount() > 0 ) {
      html += "<strong>Errors:</strong> " + errors.getErrorCount() + "<br />";
    }
    if ( errors.getWarningCount() > 0 ) {
      html += "<strong>Warnings:</strong> " + errors.getWarningCount() + "<br />";
    }
    html += "<em>See the Log below for exception details</em><br />";
    html += "<br /><hr />";
  }

  // Add Agency Information
  let tags = "";
  html += "<h2>Agencies</h2>";
  for ( let i = 0; i < opts.agencies.length; i++ ) {
    let a = opts.agencies[i];
    try {
      if ( a.update || a.compile ) {
        send_email = true;
      }
      if ( a.update && a.compile ) {
        tags += "[" + a.agency.getConfig().id.toUpperCase() + "] ";
      }

      // Agency info...
      html += "<h3>" + a.agency.getConfig().name + " [" + a.agency.getConfig().id + "]</h3>";
      if ( a.published ) html += "<strong>GTFS Published:</strong> " + a.published + "<br />";
      html += "<strong>Update Requested?</strong> " + a.update + "<br />";
      
      // Update info...
      if ( a.update ) {
        html += "<strong>Update Complete?</strong> " + a.updateComplete + "<br />";
        html += "<strong>Compilation Requested?</strong> " + a.compile + "<br />";
        
        // Compile info...
        if ( a.compile ) {
          html += "<strong>Compilation Complete?</strong> " + a.compileComplete + "<br />";
          html += "<strong>Compiled:</strong> " + a.compiled + "<br />";
          html += "<strong>Version:</strong> " + a.version + "<br />";
          html += "<strong>Notes:</strong> " + a.notes + "<br />";
          html += "<strong>Sane?</strong> " + a.sane + "<br />";
        }
      }
    }
    catch (error) {
      html += "<h3>" + a.require + "</h3>";
      html += "<strong><em>Could not process agency</em></strong><br />";
    }
  }
  html += "<br /><hr />";

  // Add Log
  html += "<h2>Log</h2>";
  html += "<pre><code>";
  html += log.history();
  html += "</code></pre>";

  // Construct Email
  let email = {
    from: opts.smtp.from || props.description + " <" + os.userInfo().username + "@" + os.hostname() + ">", 
    to: opts.email,
    subject: "[RTDB] " + tags + props.description,
    text: h2t.fromString(html),
    html: html
  }

  // Send Email
  if ( send_email ) {
    log.info("SENDING STATUS REPORT EMAIL...");

    let transporter = nodemailer.createTransport(opts.smtp);
    transporter.sendMail(email, function(err, info) {
      if (err) {
        log.error("ERROR: Could not send status report email");
        log.info(err.toString());
      }
      else {
        log("...Status report email sent");
      }
      log("================================================");
    });
  }
}


module.exports = report;