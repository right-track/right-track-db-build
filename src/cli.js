#!/usr/bin/env node
'use strict';

/**
 * ### Command Line Interface
 *
 * This module acts as the command line interface for the database builder and
 * parses the command line arguments and options to build the Database Build
 * Options ({@link Options}) that are used by the {@link module:run|run} module.
 *
 * See `node ./src/cli.js --usage` for the script's command line usage.
 * @module cli
 */



// Set process title
process.title = require('../package.json').name;


const fs = require('fs');
const path = require('path');
const props = require('../package.json');
const options = require('./helpers/options.js');
const log = require('./helpers/log.js');
const run = require('./run.js');




// Parse the CLI arguments
_parseArgs();

// Print start information
let started = new Date();
log.info("======== RIGHT TRACK DATABASE GENERATOR ========");
log("Version: " + props.version);
log("Started: " + started);

// Parse the passed agencies
try {
  _parseAgencies();  
}
catch (error) {
  log.error("ERROR: Could not parse agencies");
  log.error(error);
  process.exit(1);
}

// Start the Update Check & DB Compilation process
try {
  run();
}
catch (error) {
  log.error("ERROR: Could not run update check and DB compilation");
  log.error(error);
  process.exit(1);
}




/**
 * Parse the CLI arguments
 * @private
 */
function _parseArgs() {

  // Get cli arguments
  let args = process.argv.slice(2);

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
      options.set().force = true;
    }

    // --test / -t
    else if ( arg === '--test' || arg === '-t' ) {
      options.set().test = !options.get().test;
    }

    // --agency / -a
    else if ( arg === '--agency' || arg === '-a' ) {
      i++;
      if ( args[i] === undefined || args[i].charAt(0) === '-' ) {
        log.error("ERROR: agency declaration not defined");
        _usage();
        process.exit(1);
      }
      else {
        options.addAgency(args[i]);
      }
    }

    // --config / -c
    else if ( arg === '--config' || arg === '-c' ) {
      i++;
      if ( args[i] === undefined || args[i].charAt(0) === '-' ) {
        log.error("ERROR: config file for agency is not defined");
        _usage();
        process.exit(1);
      }
      else {
        if ( fs.existsSync(args[i]) ) {
          options.addAgencyConfig(args[i]);
        }
        else {
          log.error("ERROR: config file does not exist (" + args[i] + ")");
          log.error("Make sure the file path to the config file is correct");
          process.exit(1);
        }
      }
    }

    // --notes / -n
    else if ( arg === '--notes' || arg === '-n' ) {
      i++;
      if ( args[i] === undefined || args[i].charAt(0) === '-' ) {
        log.error("ERROR: notes for agency are not defined");
        _usage();
        process.exit(1);
      }
      else {
        options.addAgencyNotes(args[i]);
      }
    }

    // --post / -p
    else if ( arg === '--post' || arg === '-p' ) {
      i++;
      if ( args[i] === undefined || args[i].charAt(0) === '-' ) {
        log.error("ERROR: post-install script is not defined");
        _usage();
        process.exit(1);
      }
      else {
        let post = args[i];
        if ( !path.isAbsolute(post) ) {
          post = path.normalize(process.cwd() + '/' + post);
        }
        if ( fs.existsSync(post) ) {
          options.set().post = post;
        }
        else {
          log.error("ERROR: post-install script file does not exist (" + post + ")");
          log.error("Make sure the file path to the post-install script is correct");
          process.exit(1);
        }
      }
    }

  }

  // Make sure at least one agency is provided
  if ( options.agencyCount() < 1 ) {
    _usage();
    process.exit(0);
  }

  // Flag agencies for update when force is set
  if ( options.get().force ) {
    for ( let i = 0; i < options.agencyCount(); i++ ) {
      options.agency(i).update = true;
    }
  }

}


/**
 * Parse the passed agencies
 * @private
 */
function _parseAgencies() {

  log("================================================");
  log.info("PARSING AGENCIES");

  // Parse each of the agencies
  for ( let i = 0; i < options.agencyCount(); i++ ) {
    let require = undefined;

    log("------------------------------------------------");
    log.raw([
      {
        "text": "AGENCY:"
      },
      {
        "text": " " + options.agency(i).require + " ",
        "chalk": "bgYellow.black"
      }
    ]);

    // Relative path
    if ( _isRelativePath(options.agency(i).require) ) {
      require = _makeAbsolutePath(options.agency(i).require);
      if ( !fs.existsSync(require) ) {
        log.error("ERROR: Agency module path not found (" + require + ")");
        log.error("Make sure the module path is correct and properly referenced.");
        process.exit(1);
      }
    }

    // Try finding the module by name
    else {
      require = _lookupModule(options.agency(i).require);
    }


    // Unknown agency
    if ( require === undefined ) {
      log.error("ERROR: Undefined agency <" + options.agency(i).require +">.");
      log.error("Make sure the agency module is installed and properly referenced.");
      process.exit(1);
    }

    // Found agency: load the agency
    options.agency(i).require = require;
    _loadAgency(i);

  }

  // Check for duplicate agency declarations
  let locations = [];
  for ( let i = 0; i < options.agencyCount(); i++ ) {
    let agency = options.agency(i);
    if ( locations.includes(agency.agency.moduleDirectory) ) {
      log.error("ERROR: Duplicate agency declaration");
      log.error("Module location: " + agency.agency.moduleDirectory);
      process.exit(1);
    }
    else {
      locations.push(agency.agency.moduleDirectory);
    }
  }

  // Output parsed info
  log("------------------------------------------------");
  log("Agencies Parsed: " + options.agencyCount());
  log("================================================");

}


/**
 * Load the specified agency and read the agency config, if specified
 * @param {int} i Index of agency to load
 * @private
 */
function _loadAgency(i) {

  log("==> LOADING MODULE: " + options.agency(i).require);
  log("    Location: " + require.resolve(options.agency(i).require));

  // Load agency & read agency config
  try {
    let agency = require(options.agency(i).require);
    if ( options.agency(i).config !== undefined ) {
      agency.readConfig(options.agency(i).config);
    }

    // Test the getConfig function
    agency.getConfig();

    // Add loaded agency to options
    options.agency(i).agency = agency;
  }
  catch(exception) {
    log.error("ERROR: could not load agency module <" + options.agency(i).require + ">");
    log.error("Make sure the module is a Right Track Agency module");
    process.exit(1);
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
  log("  --test|-t        Test the DB compilation (does not install)");
  log("  --post|-p <file> Define a post-install script to run after update & compilation");
  log("  --help|-h        Display this usage information");
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