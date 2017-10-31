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



let options = function(options=undefined) {
  if ( options ) {
    OPTIONS = options;
  }
  else {
    return OPTIONS;
  }
};



// ==== SETTERS ==== //

options.setForce = function(force=true) {
  OPTIONS.force = force;
};


options.setPost = function(script) {
  if ( script ) {
    OPTIONS.post = script;
  }
};



options.addAgency = function(require) {
  if ( require ) {
    let agency = {};
    agency.require = require;
    agency.update = false;
    agency.updateComplete = false;
    agency.compile = false;
    agency.compileComplete = false;

    OPTIONS.agencies.push(agency);
  }
};

options.addAgencyConfig = function(config) {
  if ( config && OPTIONS.agencies.length > 0 ) {
    OPTIONS.agencies[OPTIONS.agencies.length-1].config = config;
  }
};

options.addAgencyNotes = function(notes) {
  if ( notes && OPTIONS.agencies.length > 0 ) {
    OPTIONS.agencies[OPTIONS.agencies.length-1].notes = notes;
  }
};



options.setAgencyUpdate = function(index, update=true) {
  if ( index >= 0 && index < OPTIONS.agencies.length ) {
    OPTIONS.agencies[index].update = update;
  }
};

options.setAgencyUpdateComplete = function(index, complete=true) {
  if ( index >= 0 && index < OPTIONS.agencies.length ) {
    OPTIONS.agencies[index].updateComplete = complete;
  }
};

options.setAgencyCompile = function(index, compile=true) {
  if ( index >= 0 && index < OPTIONS.agencies.length ) {
    OPTIONS.agencies[index].compile = compile;
  }
};

options.setAgencyCompileComplete = function(index, complete=true) {
  if ( index >= 0 && index < OPTIONS.agencies.length ) {
    OPTIONS.agencies[index].compileComplete = complete;
  }
};




// ==== GETTERS ==== //

options.get = function() {
  return OPTIONS;
};

options.force = function() {
  return OPTIONS.force;
};

options.agencyCount = function() {
  return OPTIONS.agencies.length;
};

options.agency = function(index) {
  return OPTIONS.agencies[index];
};



module.exports = options;