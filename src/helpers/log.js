'use strict';

/**
 * ### Console output helper
 *
 * Display output text to the console in a number of predefined styles
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
 */
log.info = function(text) {
  console.log(chalk.yellow(text))
};

/**
 * Log a warning message to the console / stderr (by default)
 * @param {string} text Message
 * @param {boolean} toStdErr Set to false to print to stdout
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
 * @param {boolean} toStdErr Set to false to print to stdout
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
 * "text": The text to display
 * "chalk": <optional> The chalk style components (ex: bgYellow.black)
 * @param {Object[]} parts List of output style components
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