'use strict';

/**
 * ### Right Track Database Build Options
 *
 * This module handles the creation and modification of the Right Track
 * Database Build Options ({@link Options}).
 * @module helpers/options
 */

const config = require('../../config.json');


/**
 * Database Build Options
 * Load the default options from the config file
 * @private
 */
let OPTIONS = config.options;




// ==== SETTERS ==== //

/**
 * Set the Right Track Database Build Options
 * @param {Options} options The Build Options
 */
function set(options) {
  if ( options ) {
    OPTIONS = options;
  }
}

/**
 * Set the force update and compilation flag
 * @param force
 */
function setForce(force=true) {
  OPTIONS.force = force;
}


/**
 * Set the Database Post-Compile Script to run after the
 * database update and compilation process is complete
 * @param {string} script Path to post-compile script
 */
function setPost(script) {
  if ( script ) {
    OPTIONS.post = script;
  }
}


/**
 * Add a new agency to the Database Build Options
 * @param {string} require Right Track Agency `require` location
 */
function addAgency(require) {
  if ( require ) {
    let agency = {};
    agency.require = require;
    agency.update = false;
    agency.updateComplete = false;
    agency.compile = false;
    agency.compileComplete = false;

    OPTIONS.agencies.push(agency);
  }
}

/**
 * Add an agency configuration file to the most recently added Agency
 * @param {string} config Path to agency configuration file
 */
function addAgencyConfig(config) {
  if ( config && OPTIONS.agencies.length > 0 ) {
    OPTIONS.agencies[OPTIONS.agencies.length-1].config = config;
  }
}

/**
 * Add database compilation notes to the most recently added Agency
 * @param {string} notes Database compilation notes
 */
function addAgencyNotes(notes) {
  if ( notes && OPTIONS.agencies.length > 0 ) {
    OPTIONS.agencies[OPTIONS.agencies.length-1].notes = notes;
  }
}



// ==== GETTERS ==== //

/**
 * Get the Database Build Options
 * @returns {Options}
 */
function get() {
  return OPTIONS;
}

/**
 * Get the Force flag
 * @returns {boolean}
 */
function force() {
  return OPTIONS.force;
}

/**
 * Get the number of agencies added to the Database Build Options
 * @returns {int}
 */
function agencyCount() {
  return OPTIONS.agencies.length;
}

/**
 * Get the agency's build options
 * @param {int} index Agency index
 * @returns {object} Agency Build Options
 */
function agency(index) {
  return OPTIONS.agencies[index];
}



module.exports = {
  set: set,
  setForce: setForce,
  setPost: setPost,
  addAgency: addAgency,
  addAgencyConfig: addAgencyConfig,
  addAgencyNotes: addAgencyNotes,
  get: get,
  force: force,
  agencyCount: agencyCount,
  agency: agency
};