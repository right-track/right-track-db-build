'use strict';

// TYPE DEFINITIONS //

/**
 * Right Track DB Build Options
 *
 * These options are set from the command line arguments and are used to
 * determine which Agencies to check for updates and compile databases for.  The
 * options are set, modified and returned via the {@link module:helpers/options|options}
 * module.
 *
 * @typedef {Object} Options
 *
 * @property {boolean} force=false Force a GTFS data update and database compilation, when true
 * @property {boolean} test=false Don't install the database, when true
 * @property {string} [post] The path to the post-update script
 * @property {AgencyOptions[]} agencies List of Agency Build Options for the Right Track
 * Agencies that are to be processed by the db-build script.
 */

/**
 * Agency Build Options
 *
 * These options are set during the update and compilation process for the specific
 * agency.  These options provide the Right Track Agency configuration, update and 
 * compilation process success and generated database version and file information.
 *
 * @typedef {Object} AgencyOptions
 *
 * @property {string} require The agency module require name or path
 * @property {string} [config] The agency module additional configuration file path
 * @property {string} [notes] The agency update notes to be included in the database
 * @property {RightTrackAgency} agency The `RightTrackAgency` Class for the agency
 * @property {boolean} update=false The GTFS data update flag (true when a GTFS data update is requested)
 * @property {boolean} updateComplete=false The GTFS data update success flag (true when GTFS data is successfully updated)
 * @property {Date} published The Date/Time the GTFS data was published
 * @property {boolean} compile=false The DB compilation flag (true when the DB compilation is requested)
 * @property {boolean} compileComplete=false The DB compilation success flag (true when DB is successfully compiled)
 * @property {Date} compiled the Date/Time the DB was compiled
 * @property {int} version the DB version code (based off of the compile date/time)
 * @property {boolean} sane=false DB Sanity Check flag (true if passed sanity checks)
 * @property {Object} files Agency Database File Locations, set when the agency database has been compiled
 * @property {string} files.tempDir Temporary database directory
 * @property {string} files.tempDb Temporary database file location
 * @property {string} files.tempDbZip Temporary database zip file location
 * @property {string} files.tempVersion Temporary version file location
 * @property {string} files.latestDir Latest database directory
 * @property {string} files.archiveDir Database archive directory
 * @property {string} files.latestDb Latest database file location
 * @property {string} files.latestDbZip Latest database zip file location
 * @property {string} files.latestVersion Latest version file location
 */

/**
 * Main process callback function.
 *
 * This callback function is used to return to the main update / compilation
 * process started by the {@link module:run|run} module.
 * @callback runCallback
 */

/**
 * Agency Update Check function.
 *
 * This function is used to check the agency for a GTFS data update.  If an
 * update is found it will download the new data and place the GTFS files
 * in the agency's GTFS directory.  Once complete, this function will call
 * the {@link updateCallback} callback function with the status of the update
 * checks (an update was requested, and if the update was successful)
 * @typedef {function} updateFunction
 * @param {Object} agencyOptions Agency build options (from {@link Options})
 * @param {updateCallback} callback The update callback function
 */

/**
 * Update callback function.
 *
 * This function is used to return the status of an agency update check:
 * whether an update is found and has been requested and whether the update
 * was successful and the new GTFS files have been downloaded.
 * @callback updateCallback
 * @param {boolean} requested Update requested flag (true when a GTFS data update was requested)
 * @param {boolean} successful Update success flag (true when a GTFS data update was successful)
 */

/**
 * Right Track Table Schema.
 *
 * This defines the Right Track Database table's properties, including table
 * fields and their types, foreign keys, and indices.
 * @typedef {Object} RTTableSchema
 * @property {string} name Name of table in the final database
 * @property {string|undefined} [sourceDirectory] Path to the directory containing the source file
 * @property {string|undefined} [sourceFile] Name of the source file
 * @property {string|undefined} [separator] Field separator used in the source file
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
 * Right Track Table Initial Values
 *
 * This defines the initial values that will be loaded into a table.
 * @typedef {Object[]} RTTableValues
 * @property {string} RTTableValues[].key Name of table column
 * @property {object} RTTableValues[].value  Value of data item
 */

/**
 * Build Table function.
 *
 * This function is used to build a table in the Right Track Database.
 * @typedef {function} buildTable
 * @param {object} db The SQLite database being built
 * @param {AgencyOptions} agencyOptions The Agency Build Options
 * @param {buildTableCallback} callback The build table callback function
 */

/**
 * Build Table callback function.
 *
 * This function is used when the build table script is complete.
 * @callback buildTableCallback
 */

/**
 * Right Track Database Builder Exception (Warning/Error)
 * @typedef {Object} RTException
 * @property {int} type The type of Exception (Warning or Error)
 * @property {string} message The Exception message
 * @property {string} [details] The Exception details
 * @property {string} [agencyId] The Agency Code of the Agency that invoked the Exception
 */
