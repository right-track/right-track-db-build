'use strict';

/**
 * ### Right Track Exception Handler
 *
 * This module helps to handle and log exceptions that occur during
 * the Right Track Database update and compilation process.
 * @module helpers/errors
 */


/**
 * Right Track Exception Type: Error
 * @type {int}
 * @default
 */
const EXCEPTION_TYPE_ERROR = 1;

/**
 * Right Track Exception Type: Warning
 * @type {int}
 * @default 0
 */
const EXCEPTION_TYPE_WARNING = 0;


/**
 * List of accumulated exceptions
 * @type {Array}
 * @private
 */
let EXCEPTIONS = [];



/**
 * Reset the list of Right Track Exceptions
 */
function reset() {
  EXCEPTIONS = [];
}


/**
 * Add an Error to the list of Right Track Exceptions
 * @param {string} message Error Message
 * @param {string|undefined} details Error Details
 * @param {string|undefined} agencyId Agency Code of Agency invoking the Error
 */
function error(message, details, agencyId) {
  EXCEPTIONS.push(
    {
      "type": EXCEPTION_TYPE_ERROR,
      "message": message,
      "details": details,
      "agencyId": agencyId
    }
  );
}


/**
 * Add a Warning to the list of Right Track Exceptions
 * @param {string} message Warning Message
 * @param {string|undefined} details Warning Details
 * @param {string|undefined} agencyId Agency Code of Agency invoking the Warning
 */
function warning(message, details, agencyId) {
  EXCEPTIONS.push(
    {
      "type": EXCEPTION_TYPE_WARNING,
      "message": message,
      "details": details,
      "agencyId": agencyId
    }
  );
}


/**
 * Get the list of all Right Track Exceptions
 * @returns {Array}
 */
function getExceptions() {
  return EXCEPTIONS;
}


/**
 * Get the list of all Right Track Errors
 * @returns {Array}
 */
function getErrors() {
  return _getExceptionsByType(EXCEPTION_TYPE_ERROR);
}

/**
 * Get the number of Right Track Errors
 * @returns {Number}
 */
function getErrorCount() {
  return getErrors().length;
}


/**
 * Get the list of all Right Track Warnings
 * @returns {Array}
 */
function getWarnings() {
  return _getExceptionsByType(EXCEPTION_TYPE_WARNING);
}

/**
 * Get the number of Right Track Warnings
 * @returns {Number}
 */
function getWarningCount() {
  return getWarnings().length;
}


/**
 * Get the list of all Right Track Exceptions matching the exception type
 * @param {int} type Right Track Exception Type
 * @returns {Array}
 * @private
 */
function _getExceptionsByType(type) {
  let rtn = [];
  for ( let i = 0; i < EXCEPTIONS.length; i++ ) {
    let exception = EXCEPTIONS[i];
    if ( exception.type === type ) {
      rtn.push(exception);
    }
  }
  return rtn;
}



module.exports = {
  reset: reset,
  error: error,
  warning: warning,
  getExceptions: getExceptions,
  getErrors: getErrors,
  getErrorCount: getErrorCount,
  getWarnings: getWarnings,
  getWarningCount: getWarningCount
};