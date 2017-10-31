'use strict';

// TYPE DEFINITIONS //

/**
 * Right Track DB Build Options
 * @typedef {Object} Options
 * @property {boolean} force=false Force update and compile flag
 * @property {string} [post] The path to the post-update script
 * @property {Object[]} agencies List of agencies to check for updates & compile
 * @property {string} agencies[].require The agency module require name or path
 * @property {string} [agencies[].config] The agency module additional configuration file path
 * @property {string} [agencies[].notes] The agency update notes to be included in the database
 * @property {RightTrackAgency} agencies[].agency The `RightTrackAgency` Class for the agency
 * @property {boolean} agencies[].update=false The GTFS data update flag (true when a GTFS data update is requested)
 * @property {boolean} agencies[].updateComplete=false The GTFS data update success flag (true when GTFS data is successfully updated)
 * @property {boolean} agencies[].compile=false The DB compilation flag (true when the DB compilation is requested)
 * @property {boolean} agencies[].compileComplete=false The DB compilation success flag (true when DB is successfully compiled)
 */

/**
 * Main process callback function.
 * These callback functions are used to return to the main update / compilation
 * process started by the {@link module:run|run} module.
 * @callback runCallback
 */

/**
 * Update callback function
 * @callback updateCallback
 * @param {string[]} errors List of newly encountered errors
 * @param {boolean} update Update flag (true when the GTFS data has been updated)
 */

/**
 * Right Track Table Schema
 * @typedef {Object} RTTableSchema
 * @property {string} [source] Name of source file
 * @property {string} name Name of table in the final database
 * @property {Object[]} fields List of table fields
 * @property {string} fields[].name Name of field (will be column name in final table and must match source file header name unless `source_name` is specified)
 * @property {string} fields[].type Data Type of field (TEXT, INTEGER, etc)
 * @property {string} [fields[].attributes] Additional attributes of field (PRIMARY KEY, NOT NULL, etc)
 * @property {string} [fields[].source_name] Source file header for field (if different than `name`)
 * @property {boolean} [fields[].index] Set to true to make an index for this field
 * @property {Object} [fields[].foreignKey] Set a foreign key relationship with this field
 * @property {string} fields[].foreignKey.table Foreign Table Name
 * @property {string} fields[].foreignKey.field Foreign Field Name
 */

/**
 * Right Track Database Builder Exception (Warning/Error)
 * @typedef {Object} RTException
 * @property {int} type The type of Exception (Warning or Error)
 * @property {string} message The Exception message
 * @property {string} [details] The Exception details
 * @property {string} [agencyId] The Agency Code of the Agency that invoked the Exception
 */
