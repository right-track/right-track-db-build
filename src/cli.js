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
const errors = require('./helpers/errors.js');
const run = require('./run.js');
const report = require('./report.js');



// COMMAND LINE ARGUMENTS
let ARGS = process.argv.slice(2);

// OPTIONS USED AS FLAGS (do not take arguments)
const OPTS_FLAGS = ["force", "f", "test", "t", "smtp-secure", "smtp-require-tls", "help", "h", "version", "v"];

// OPTIONS THAT TAKE ARGUMENTS
const OPTS_ARGS = ["post", "p", "email", "e", "smtp-host", "smtp-port", "smtp-user", "smtp-pass", "smtp-from", 
    "agency", "a", "config", "c", "notes", "n"];



// Start the CLI
init();




// ==== MAIN ENTRY POINT ==== //

/**
 * Start processing the CLI arguments and run the
 * DB build scripts
 */
function init() {

  // Check and Parse config file, if provided
  try {
    _parseConfig();
  }
  catch (error) {
    errors.error("Could not parse config file", error);
  }


  // Parse the CLI arguments
  try {
    if ( errors.getErrorCount() === 0 ) {
      _parseArgs();
    }
  }
  catch (error) {
    errors.error("Could not parse CLI arguments", error);
  }


  // Parse the passed agencies
  try {
    if ( errors.getErrorCount() === 0 ) {
      _parseAgencies();
    }
  }
  catch (error) {
    errors.error("Could not parse agencies", error);
  }


  // Start the Update Check & DB Compilation process
  try {
    if ( errors.getErrorCount() === 0 ) {
      run(function() {
        _report();
      });
    }
    else {
      _report();
    }
  }
  catch (error) {
    errors.error("Could not run update check and DB compilation", error);
    _report();
  }

}


// ==== HELPER FUNCTIONS ==== //


/**
 * Check if a config file path has been provided
 * If it has, parse the config file and merge it 
 * with the default configuration
 * @private
 */
function _parseConfig() {

  // Check for a config file path
  let config = _checkConfig();

  // Read the config file
  if ( config ) {
    _readConfig(config);
  }

}


/**
 * Check if a config file path has been provided
 * @return {string} path to possible config file
 * @private
 */
function _checkConfig() {

  // Get last 2 arguments
  let last_arg = undefined;
  let second_last_arg = undefined;
  if ( ARGS.length > 0 ) {
    last_arg = ARGS[ARGS.length-1];
  }
  if ( ARGS.length > 1 ) {
    second_last_arg = ARGS[ARGS.length-2];
  }

  // Check Args
  let check_last = _checkOption(last_arg);
  let check_second_last = _checkOption(second_last_arg);

  // Last arg should be parsed as config location...
  if ( last_arg && check_last === 0 && check_second_last !== 2 && last_arg.charAt(0) !== "-" ) {
    ARGS.pop();
    return last_arg;
  }

  // No config file found
  return undefined;

}


/**
 * Read the config file from the specified path
 * @param  {string} location Path to config file
 * @private
 */
function _readConfig(location) {

  // Check if file exists
  if ( !fs.existsSync(location) ) {
    return errors.error("Config file not found", "Make sure the path to the config file is correct [" + location + "]");
  }

  // Read the config file
  let config = require(fs.realpathSync(location));

  // Parse the config file
  if ( config.hasOwnProperty('test') ) {
    options.set().test = config.test;
  }
  if ( config.hasOwnProperty('force') ) {
    options.set().force = config.force;
  }
  if ( config.hasOwnProperty('post') ) {
    options.set().post = fs.realpathSync(config.post);
  }
  if ( config.hasOwnProperty('email') ) {
    options.set().email = config.email;
  }
  if ( config.hasOwnProperty('agencies') ) {
    if ( Array.isArray(config.agencies) ) {
      for ( let i = 0; i < config.agencies.length; i++ ) {
        let a = config.agencies[i];
        if ( typeof a === 'string' ) {
          options.addAgency(a);
        }
        else if ( a !== null && typeof a === 'object' ) {
          if ( a.hasOwnProperty('agency') ) {
            options.addAgency(a.agency);
            if ( a.hasOwnProperty('config') ) {
              options.addAgencyConfig(a.config);
            }
            if ( a.hasOwnProperty('notes') ) {
              options.addAgencyNotes(a.notes);
            }
          }
        }
      }
    }
  }
  if ( config.hasOwnProperty('smtp') ) {
    let smtp = config.smtp;
    if ( smtp.hasOwnProperty('host') ) {
      options.set().smtp.host = smtp.host;
    }
    if ( smtp.hasOwnProperty('port') ) {
      options.set().smtp.port = smtp.port;
    }
    if ( smtp.hasOwnProperty('secure') ) {
      options.set().smtp.secure = smtp.secure;
    }
    if ( smtp.hasOwnProperty('requireTLS') ) {
      options.set().smtp.requireTLS = smtp.requireTLS;
    }
    if ( smtp.hasOwnProperty('auth') ) {
      let auth = smtp.auth;
      if ( auth.hasOwnProperty('user') ) {
        options.set().smtp.auth.user = auth.user;
      }
      if ( auth.hasOwnProperty('pass') ) {
        options.set().smtp.auth.pass = auth.pass;
      }
    }
    if ( smtp.hasOwnProperty('from') ) {
      options.set().smtp.from = smtp.from;
    }
  }

}


/**
 * Parse the CLI arguments
 * @private
 */
function _parseArgs() {

  // Parse arguments
  for ( let i = 0; i < ARGS.length; i++ ) {
    let arg = ARGS[i];

    // Unsupported argument
    if ( _checkOption(arg) === 0 ) {
      return errors.error("Unrecognized option", "The option is not supported [" + arg + "]");
    }

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
      if ( ARGS[i] === undefined || ARGS[i].charAt(0) === '-' ) {
        return errors.error("Agency declaration is not defined");
      }
      else {
        options.addAgency(ARGS[i]);
      }
    }

    // --config / -c
    else if ( arg === '--config' || arg === '-c' ) {
      i++;
      if ( ARGS[i] === undefined || ARGS[i].charAt(0) === '-' ) {
        return errors.error("Config file for agency is not defined");
      }
      else if ( options.agencyCount() < 1 ) {
        return errors.error("The --config|-c argument must be preceded by an --agency <...> declaration")
      }
      else {
        if ( fs.existsSync(ARGS[i]) ) {
          options.addAgencyConfig(ARGS[i]);
        }
        else {
          return errors.error("Config file does not exist", "File not found [" + ARGS[i] + "]");
        }
      }
    }

    // --notes / -n
    else if ( arg === '--notes' || arg === '-n' ) {
      i++;
      if ( ARGS[i] === undefined || ARGS[i].charAt(0) === '-' ) {
        return errors.error("Notes for agency are not defined");
      }
      else if ( options.agencyCount() < 1 ) {
        return errors.error("The --notes|-n argument must be preceded by an --agency <...> declaration");
      }
      else {
        options.addAgencyNotes(ARGS[i]);
      }
    }

    // --post / -p
    else if ( arg === '--post' || arg === '-p' ) {
      i++;
      if ( ARGS[i] === undefined || ARGS[i].charAt(0) === '-' ) {
        return errors.error("The post-install script is not defined");
      }
      else {
        let post = ARGS[i];
        if ( !fs.existsSync(post) ) {
          return errors.error("The post-install script does not exist", "File not found [" + post + "]");
        }
        options.set().post = fs.realpathSync(post);
      }
    }

    // --email / -e
    else if ( arg === '--email' || arg === '-e' ) {
      i++;
      if ( ARGS[i] === undefined || ARGS[i].charAt(0) === '-' ) {
        return errors.error("Email address is not defined");
      }
      else {
        options.set().email = ARGS[i];
      }
    }

    // --smtp-host
    else if ( arg === '--smtp-host' ) {
      i++;
      if ( ARGS[i] === undefined || ARGS[i].charAt(0) === '-' ) {
        return errors.error("SMTP host is not defined");
      }
      else {
        options.set().smtp.host = ARGS[i];
      }
    }

    // --smtp-port
    else if ( arg === '--smtp-port' ) {
      i++;
      if ( ARGS[i] === undefined || ARGS[i].charAt(0) === '-' ) {
        return errors.error("SMTP port is not defined");
      }
      else {
        options.set().smtp.port = ARGS[i];
      }
    }

    // --smtp-secure
    else if ( arg === '--smtp-secure' ) {
      options.set().smtp.secure = !options.set().smtp.secure;
    }

    // --smtp-require-tls
    else if ( arg === '--smtp-require-tls' ) {
      options.set().smtp.requireTLS = !options.set().smtp.requireTLS;
    }

    // --smtp-user
    else if ( arg === '--smtp-user' ) {
      i++;
      if ( ARGS[i] === undefined || ARGS[i].charAt(0) === '-' ) {
        return errors.error("SMTP user is not defined");
      }
      else {
        options.set().smtp.auth.user = ARGS[i];
      }
    }

    // --smtp-pass
    else if ( arg === '--smtp-pass' ) {
      i++;
      if ( ARGS[i] === undefined || ARGS[i].charAt(0) === '-' ) {
        return errors.error("SMTP password is not defined");
      }
      else {
        options.set().smtp.auth.pass = ARGS[i];
      }
    }

    // --smtp-from
    else if ( arg === '--smtp-from' ) {
      i++;
      if ( ARGS[i] === undefined || ARGS[i].charAt(0) === '-' ) {
        return errors.error("SMTP From is not defined");
      }
      else {
        options.set().smtp.from = ARGS[i];
      }
    }

  }

  // Make sure at least one agency is provided
  if ( options.agencyCount() < 1 ) {
    return errors.error("No agencies defined", "At least one agency must be defined");
  }

  // Flag agencies for update when force is set
  if ( options.get().force ) {
    for ( let i = 0; i < options.agencyCount(); i++ ) {
      options.agency(i).update = true;
    }
  }

  // Print start info
  log.info("======== RIGHT TRACK DATABASE GENERATOR ========");
  log("Version: " + props.version);
  log("Started: " + new Date());

}


/**
 * Parse the passed agencies
 * @private
 */
function _parseAgencies() {

  // Print start information
  log("================================================");
  log.info("PARSING AGENCIES");

  // Parse each of the agencies
  for ( let i = 0; i < options.agencyCount(); i++ ) {
    let req = undefined;

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
      req = _makeAbsolutePath(options.agency(i).require);
      if ( !fs.existsSync(req) ) {
        return errors.error(
          "Could not load agency module", 
          "Agency module path not found [" + req + "]"
        );
      }
    }

    // Try finding the module by name
    else {
      req = _lookupModule(options.agency(i).require);
    }


    // Unknown agency
    if ( req === undefined ) {
      return errors.error(
        "Could not load agency module", 
        "Make sure the agency module is installed and properly referenced [" + options.agency(i).require + "]"
      );
    }

    // Found agency: load the agency
    options.agency(i).require = req;
    _loadAgency(i);

  }

  // Check for duplicate agency declarations
  let locations = [];
  for ( let i = 0; i < options.agencyCount(); i++ ) {
    let agency = options.agency(i);
    if ( locations.includes(agency.agency.moduleDirectory) ) {
      return errors.error(
        "Duplicate agency declaration",
        "The agency module has been declared more than once [" + agency.agency.moduleDirectory + "]"
      );
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
    return errors.error(
      "Could not load agency module", 
      "The specified agency module could not be loaded as a Right Track Agency [" + options.agency(i).require + "]."
    );
  }

}


/**
 * Generate and send the summary report
 * @private
 */
function _report() {
  try {
    report();
  }
  catch (error) {
    log.error("ERROR: Could not send email report");
    log.error(error);
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
  log("  " + path.basename(process.argv[1]) + " [options] --agency <declaration> [agency options] ... [config file]");
  log("");
  log("config file:");
  log("  The path to a configuration file can be used to provide the configuration options for the db build script.");
  log("  The values in the configuration file will override the default values.  Values provided as CLI arguments");
  log("  will override the default values and those in the specified configuration file (if provided).");
  log("  See the README for more detailed information about available configuration variables.");
  log("");
  log("options:");
  log("  --force|-f             Force a GTFS update and database compilation");
  log("  --test|-t              Test the DB compilation (does not install)");
  log("  --post|-p <file>       Define a post-install script to run after update & compilation");
  log("  --email|-e <email>     Email address to send DB build results to");
  log("  --smtp-host <host>     SMTP server host");
  log("  --smtp-port <port>     SMTP server port");
  log("  --smtp-user <username> SMTP server username");
  log("  --smtp-pass <password> SMTP server password");
  log("  --smtp-from <name <email>>  SMTP server From address");
  log("  --smtp-secure          SMTP server use TLS");
  log("  --smtp-require-tls     SMTP server require TLS");
  log("  --help|-h              Display this usage information");
  log("  --version|-v           Display the DB Build script version");
  log("");
  log("agency declaration:");
  log("  Declare an agency to check for GTFS updates/compile database.  The agency");
  log("  can be declared by module name, agency id or file path.  For example:");
  log("  --agency right-track-agency-mnr");
  log("  --agency mnr");
  log("  --agency ./path/to/right-track-agency-mnr");
  log("");
  log("agency options:");
  log("  These options have to be proceeded by an agency declaration (--agency <...>)");
  log("  --config|-c <file>");
  log("     Specify the path to an optional agency configuration file");
  log("  --notes|-n <notes>");
  log("     Specify agency update notes to be included in the new database");
}






// ==== HELPER FUNCTIONS ==== //


/**
 * Check if the provided option is supported
 * @param {string} check The option to check
 * @return {int} 0 = not supported, 1 = flag, 2 = argument
 * @private
 */
function _checkOption(check) {
  for ( let i = 0; i < OPTS_FLAGS.length; i++ ) {
    let opt = OPTS_FLAGS[i];
    opt = opt.length === 1 ? "-" + opt : "--" + opt;
    if ( opt === check ) {
      return 1;
    }
  }
  for ( let i = 0; i < OPTS_ARGS.length; i++ ) {
    let opt = OPTS_ARGS[i];
    opt = opt.length === 1 ? "-" + opt : "--" + opt;
    if ( opt === check ) {
      return 2;
    }
  }
  return 0;
}


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