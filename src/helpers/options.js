'use strict';

/**
 * ### Right Track Database Build Options
 *
 * This module handles the creation and modification of the Right Track
 * Database Build Options ({@link Options}).
 * @module helpers/options
 */

/**
 * Database Build Options
 * Load the default options from the config file
 * @private
 */
let OPTIONS = require('../../config.json').options;




// ==== SETTERS ==== //

/**
 * Set the Right Track Database Build Options
 * @param {Options} [options] The Build Options
 * @returns {Options} The Build Options
 */
function set(options) {
  if ( options ) {
    OPTIONS = options;
  }
  return OPTIONS;
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
    agency.published = undefined;
    agency.compile = false;
    agency.compileComplete = false;
    agency.compiled = undefined;
    agency.version = undefined;
    agency.sane = false;

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
 * Get the number of agencies added to the Database Build Options
 * @returns {int}
 */
function agencyCount() {
  return OPTIONS.agencies.length;
}

/**
 * Get the agency's build options
 * @param {int} index Agency index
 * @returns {AgencyOptions} Agency Build Options
 */
function agency(index) {
  return OPTIONS.agencies[index];
}



module.exports = {
  set: set,
  addAgency: addAgency,
  addAgencyConfig: addAgencyConfig,
  addAgencyNotes: addAgencyNotes,
  get: get,
  agencyCount: agencyCount,
  agency: agency
};