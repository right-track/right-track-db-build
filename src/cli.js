#!/usr/bin/env node
'use strict';

// Set process title
process.title = require('../package.json').name;


const path = require('path');
const props = require('../package.json');
const config = require('../config.json');
const start = require('./start.js');
const chalk = require('chalk');
const log = console.log;
const info = function(text) {console.log(chalk.yellow(text))};
const error = function(text) {console.error(chalk.bold.red(text))};



/**
 * The default DB Build Options
 * @type {Options} DB Build Options
 * @private
 */
let OPTIONS = config.options;





// Parse the CLI arguments
_parseArgs();

// Print start information
let started = new Date();
info("======== RIGHT TRACK DATABASE GENERATOR ========");
log("Version: " + props.version);
log("Started: " + started);

// Parse the passed agencies
_parseAgencies();

// Start the Update Check & DB Compilation process
start(OPTIONS);





/**
 * Parse the CLI arguments
 * @private
 */
function _parseArgs() {

  // Get cli arguments
  let args = process.argv.slice(2);

  // Agency counter
  let count = OPTIONS.agencies.length-1;

  // Parse arguments
  for ( let i = 0; i < args.length; i++ ) {
    let arg = args[i];

    // --help / -h
    if ( arg === '--help' || arg === '-h' ) {
      _usage();
      process.exit(0);
    }

    // --version / -v
    else if ( arg === '--version' || arg === '-v' ) {
      log("Version: " + props.version);
      process.exit(0);
    }

    // --force / -f
    else if ( arg === '--force' || arg === '-f' ) {
      OPTIONS.force = true;
    }

    // --agency / -a
    else if ( arg === '--agency' || arg === '-a' ) {
      i++;
      if ( args[i] === undefined || args[i].charAt(0) === '-' ) {
        _usage();
        process.exit(0);
      }
      else {
        count++;
        OPTIONS.agencies[count] = {};
        OPTIONS.agencies[count].require = args[i];
        OPTIONS.agencies[count].update = false;
        OPTIONS.agencies[count].compile = false;
      }
    }

    // --config / -c
    else if ( arg === '--config' || arg === '-c' ) {
      i++;
      if ( count < 0 || args[i] === undefined || args[i].charAt(0) === '-' ) {
        _usage();
        process.exit(0);
      }
      else {
        OPTIONS.agencies[count].config = args[i];
      }
    }

    // --notes / -n
    else if ( arg === '--notes' || arg === '-n' ) {
      i++;
      if ( count < 0 || args[i] === undefined || args[i].charAt(0) === '-' ) {
        _usage();
        process.exit(0);
      }
      else {
        OPTIONS.agencies[count].notes = args[i];
      }
    }

    // --post / -p
    else if ( arg === '--post' || arg === '-p' ) {
      i++;
      if ( args[i] === undefined || args[i].charAt(0) === '-' ) {
        _usage();
        process.exit(0);
      }
      else {
        OPTIONS.post = args[i];
      }
    }

  }

  // Make sure at least one agency is provided
  if ( count === -1 ) {
    _usage();
    process.exit(0);
  }

  // Flag agencies for update when force is set
  if ( OPTIONS.force ) {
    for ( let i = 0; i < OPTIONS.agencies.length; i++ ) {
      OPTIONS.agencies[i].update = true;
    }
  }

}


/**
 * Parse the passed agencies
 * @private
 */
function _parseAgencies() {

  log("================================================");
  info("PARSING AGENCIES");

  // Temp agencies
  let agencies = [];

  // Parse each of the agencies
  for ( let i = 0; i < OPTIONS.agencies.length; i++ ) {
    let agency = OPTIONS.agencies[i];
    let require = undefined;

    log("------------------------------------------------");
    log("AGENCY: " + chalk.bgYellow.black(" " + agency.require + " "));


    // Relative path
    if ( _isRelativePath(agency.require) ) {
      require = _makeAbsolutePath(agency.require);
    }

    // Try finding the module by name
    else {
      require = _lookupModule(agency.require);
    }


    // Unknown agency
    if ( require === undefined ) {
      error("ERROR: Undefined agency <" + agency.require +">.");
      error("Make sure the agency module is installed and properly referenced.");
      OPTIONS.errors.push("Undefined agency <" + agency.require + ">");
    }

    // Found agency: load the agency, add its options to the list
    else {
      agency.require = require;
      let loaded = _loadAgency(agency);
      if ( loaded !== undefined ) {
        agencies.push(loaded);
      }
    }

  }

  // Replace agencies
  OPTIONS.agencies = agencies;

  // Check for duplicate agency declarations
  let locations = [];
  for ( let i = 0; i < OPTIONS.agencies.length; i++ ) {
    let agency = OPTIONS.agencies[i];
    if ( locations.includes(agency.agency.moduleDirectory) ) {
      error("ERROR: Duplicate agency declaration");
      error("       Module location: " + agency.agency.moduleDirectory);
      process.exit(1);
    }
    else {
      locations.push(agency.agency.moduleDirectory);
    }
  }

  // Output parsed info
  log("------------------------------------------------");
  log("Agencies Parsed: " + OPTIONS.agencies.length);
  log("================================================");

}


/**
 * Load the specified agency and read the agency config, if specified
 * @param {object} options agency options (as parsed from cli)
 * @returns {object} agency options with RightTrackAgency added
 * @private
 */
function _loadAgency(options) {

  log("==> LOADING MODULE: " + options.require);

  // Load agency & read agency config
  try {
    let agency = require(options.require);
    if ( options.config !== undefined ) {
      agency.readConfig(options.config);
    }

    // Test the getConfig function
    agency.getConfig();

    // Add loaded agency to options
    options.agency = agency;

    // Return the modified options
    return options;
  }
  catch(exception) {
    error("ERROR: could not load agency <" + options.require + ">");
    OPTIONS.errors.push("Could not load agency <" + options.require + ">");
    return undefined;
  }

}


/**
 * Print the usage information
 * @private
 */
function _usage() {
  log(props.description);
  log("Module: " + props.name);
  log("Version: " + props.version);
  log("----------------------------");
  log("Usage:");
  log("  " + path.basename(process.argv[1]) + " [options] --agency <declaration> [agency options] ...");
  log("options:");
  log("  --force|-f       Force a GTFS update and database compilation");
  log("  --help|-h        Display this usage information");
  log("  --post|-p <file> Define script to run after update & compilation");
  log("  --version|-v     Display the DB Build script version");
  log("agency declaration:");
  log("  Declare an agency to check for GTFS updates/compile database.  The agency");
  log("  can be declared by module name, agency id or file path.  For example:");
  log("  --agency right-track-agency-mnr");
  log("  --agency mnr");
  log("  --agency ./path/to/right-track-agency-mnr");
  log("agency options:");
  log("  These options have to be proceeded by an agency declaration (--agency <...>)");
  log("  --config|-c <file>");
  log("     Specify the path to an optional agency configuration file");
  log("  --notes|-n <notes>");
  log("     Specify agency update notes to be included in the new database");
}






// ==== HELPER FUNCTIONS ==== //


/**
 * Check if the directory is a relative path (begins with './' or '../')
 * @param {string} directory Path to directory
 * @return {boolean} True if the directory is a relative path
 * @private
 */
function _isRelativePath(directory) {
  if ( typeof directory === 'string' ) {
    if ( directory.charAt(0) === '.' ) {
      if ( directory.charAt(1) === '/' ) {
        return true;
      }
      if ( directory.charAt(1) === '.' ) {
        if ( directory.charAt(2) === '/' ) {
          return true;
        }
      }
    }
    return false;
  }
  else {
    return false;
  }
}

/**
 * Change a relative path to an absolute path (relative to the process cwd)
 * @param {string} relative The relative path
 * @returns {string} The absolute path
 * @private
 */
function _makeAbsolutePath(relative) {
  return path.normalize(
    path.join(process.cwd(), '/', relative)
  );
}


/**
 * Lookup the agency module name
 * @param {string} agency Module name or Agency ID
 * @returns {string|undefined} agency module name
 * @private
 */
function _lookupModule(agency) {

  // agency is module name
  if ( _resolve(agency) !== undefined ) {
    return agency;
  }

  // agency is agency code
  else if ( _resolve('right-track-agency-' + agency) !== undefined ) {
    return 'right-track-agency-' + agency;
  }

  // unknown module
  return undefined;

}


/**
 * Get the file path of the specified module
 * @param {string} name module name
 * @returns {string|undefined} module file path
 * @private
 */
function _resolve(name) {
  try {
    return require.resolve(name);
  }
  catch(exception) {
    return undefined;
  }
}