'use strict';

/**
 * ### Console output helper
 *
 * Display output text to the console in a number of predefined styles.
 *
 * This module exports the log function which includes the other documented
 * functions as properties of itself.
 *
 * Usage:
 * ```
 * const log = require('./log.js');
 * log("Log a general message");
 * log.info("Log an informational message");
 * ```
 * @module helpers/log
 */

const chalk = require('chalk');

/**
 * Log a general message to the console / stdout
 * @param {string} text Message
 */
let log = function(text) {
  console.log(text);
};

/**
 * Log an information message to the console / stdout
 * @param {string} text Message
 * @name info
 * @function
 */
log.info = function(text) {
  console.log(chalk.yellow(text))
};

/**
 * Log a warning message to the console / stderr (by default)
 * @param {string} text Message
 * @param {boolean} [toStdErr=true] Set to false to print to stdout
 * @name warning
 * @function
 */
log.warning = function(text, toStdErr=true) {
  let raw = chalk.bold.red(text);
  if ( toStdErr ) {
    console.error(raw);
  }
  else {
    console.log(raw);
  }
};

/**
 * Log an error message to the console / stderr (by default)
 * @param {string} text Message
 * @param {boolean} [toStdErr=true] Set to false to print to stdout
 * @name error
 * @function
 */
log.error = function(text, toStdErr=true) {
  let raw = chalk.bold.bgRed.white(" " + text + " ");
  if ( toStdErr ) {
    console.error(raw);
  }
  else {
    console.log(raw);
  }
};


/**
 * Explicitly define the console output style.  The components of
 * the output are specified as a list of objects with the properties:
 * - "text": The text to display
 * - "chalk": The chalk style components (ex: bgYellow.black)
 * @param {Object[]} parts List of output style components
 * @param {string} parts[].text The text to output
 * @param {string} [parts[].chalk] The chalk style components (ex: bgYellow.black)
 * @name raw
 * @function
 */
log.raw = function(parts) {
  let raw = "";
  for ( let i = 0; i < parts.length; i++ ) {
    let part = parts[i];
    if ( part.chalk ) {
      let chalkParts = part.chalk.split('.');
      let obj = chalk;
      for ( let j = 0; j < chalkParts.length; j++ ) {
        obj = obj[chalkParts[j]];
      }
      raw += obj(part.text);
    }
    else {
      raw += part.text;
    }
    if ( i < parts.length-1 ) {
      raw += " ";
    }
  }
  console.log(raw);
};


module.exports = log;