'use strict';

/**
 * #### Database Building Utility Functions
 *
 * These functions can be used to:
 * - create a new table based on a supplied Right Track Table Schema
 * - load the table with the data from the specified source file
 * - add a specified set of initial data to a table
 * @module compile/utils/build
 */

const rl = require('readline');
const fs = require('fs');
const path = require('path');
const split = require('csv-split-easy').splitEasy;
const log = require('../../helpers/log.js');
const errors = require('../../helpers/errors.js');


/**
 * Initialize the Table in the database.  This will drop an existing table,
 * create a new one (along with any specified indices and/or foreign key
 * relationships) and import the data from the table's source file.
 * @param {object} db SQLite Database being built
 * @param {RTTableSchema} table The Right Track Table Schema
 * @param {AgencyOptions} agencyOptions The Agency Build Options
 * @param {buildTableCallback} callback Callback function called when init is finished
 */
function init(db, table, agencyOptions, callback) {

  // Create the Table
  create(db, table, function() {

    // Load the source file into the table
    load(db, table, agencyOptions, callback);

  });

}


/**
 * Create the table in the database, along with indices and foreign keys
 * @param {object} db SQLite Database being built
 * @param {RTTableSchema} table The Right Track Table Schema
 * @param {buildTableCallback} callback Callback function called when create is finished
 */
function create(db, table, callback) {
  log("        ... Creating " + table.name);

  // Drop Table
  let drop = "DROP TABLE IF EXISTS " + table.name + ";";

  // Create Table
  let create = "CREATE TABLE IF NOT EXISTS " + table.name + " (";
  let indices = "";
  let foreignKeys = "";

  // Loop through each of the table's fields
  for ( let i = 0; i < table.fields.length; i++ ) {
    let field = table.fields[i];

    // Add to create statement
    create += field.name + " " + field.type;
    if ( field.attributes !== undefined ) {
      create += " " + field.attributes;
    }
    if ( i < table.fields.length-1 ) {
      create += ", ";
    }

    // Add Index
    if ( field.index ) {
      indices += "CREATE INDEX IF NOT EXISTS " + field.name + "_index ON " + table.name + " ('" + field.name + "'); ";
    }

    // Add foreign key
    if ( field.foreignKey ) {
      foreignKeys += ", FOREIGN KEY (" + field.name + ") REFERENCES " + field.foreignKey.table + " (" + field.foreignKey.field + ")";
    }

  }
  create += foreignKeys;
  create += ");";

  // Run SQL Statements
  db.exec(drop, function() {
    db.exec(create, function() {
      db.exec(indices, function() {
        callback();
      });
    });
  });

}


/**
 * Load the source file into the database
 * @param {object} db SQLite database being built
 * @param {RTTableSchema} table The Right Track Table Schema
 * @param {AgencyOptions} agencyOptions Agency Build Options
 * @param {buildTableCallback} callback Callback function called when load is finished
 */
function load(db, table, agencyOptions, callback) {

  // Skip when no source file provided
  if ( table.sourceFile === undefined && table.sourceDirectory === undefined ) {
    return callback();
  }

  // Make sure source directory is defined if source file provided
  if ( table.sourceFile !== undefined && table.sourceDirectory === undefined ) {
    let msg = "Source directory and/or file are not defined for table " + table.name;
    log.warning("        WARNING: " + msg);
    errors.warning(msg, "Directory: " + table.sourceDirectory + " and File: " + table.sourceFile, agencyOptions.agency.id);
    return callback();
  }

  // Determine source file
  let sourceDirectory = table.sourceDirectory;
  let sourceFile = table.sourceFile;

  // Add agency module directory to relative paths
  if ( _isRelativePath(sourceDirectory) ) {
    sourceDirectory = path.normalize(agencyOptions.agency.moduleDirectory + "/" + sourceDirectory);
  }

  // Build File Path
  let file = path.normalize(sourceDirectory + "/" + sourceFile);

  // Make sure file actually exists
  if ( !fs.existsSync(file) ) {
    let msg = "Source file does not exist (" + sourceFile + ")";
    log.warning("        WARNING: " + msg);
    errors.warning(msg, "File Location: " + file, agencyOptions.agency.id);
    return callback();
  }



  // Start the import...
  log("        ... Importing " + path.basename(file));


  // Source File Headers
  let readHeaders = false;
  let headers = [];

  // Start Transaction
  db.exec("BEGIN TRANSACTION;");

  // Setup readline interface
  let rd = rl.createInterface({
    input: fs.createReadStream(file),
    crlfDelay: Infinity
  });

  // Read each line of the source file
  rd.on('line', function(line) {
    if ( line.toString().length > 0 ) {
      if ( !readHeaders ) {
        headers = _split(line, table.separator);
        readHeaders = true;
      }
      else {
        let items = _split(line, table.separator);

        // Start column and value data strings
        let columns = "(";
        let values = "(";

        // Loop through each value
        for ( let i = 0; i < items.length; i++ ) {
          let header = headers[i];
          let value = items[i];
          let field = _findField(header, table.fields);

          // Add field name and value based on field information
          if ( field !== undefined ) {

            // Add field name
            columns += field.name;

            // Add field value
            if ( field.type.toUpperCase() === 'TEXT' ) {
              values += "'" + value + "'";
            }
            else {
              if ( value === '' ) {
                values += 'NULL';
              }
              else {
                values += value;
              }
            }
          }

          // Add default field name and value
          else {
            columns += header;
            values += "'" + value + "'";
          }

          // Add commas
          if ( i < items.length - 1 ) {
            columns += ", ";
            values += ", ";
          }
        }

        // End columns and values strings
        columns += ")";
        values += ")";

        // Build INSERT statement
        let sql = "INSERT INTO " + table.name + " " + columns + " VALUES " + values + ";";

        // Execute the INSERT
        db.exec(sql);
      }
    }
  });

  rd.on('close', function() {
    db.exec("COMMIT;", function() {
      callback();
    });
  });
}


/**
 * Add the specified values into the table
 * @param {object} db SQLite database being built
 * @param {RTTableSchema} table The Right Track Table Schema
 * @param {object[]} values List of data to add to table.  Each object is a set
 * of data keypairs where the property name is the column header name and the
 * value is the data value to add.  Property names must match field names as
 * specified in the `RTTableSchema`.
 * @param {buildTableCallback} callback Callback function called when the data has been added
 */
function add(db, table, values, callback) {
  log("        ... Adding data to " + table.name);
  db.serialize(function() {
    db.exec("BEGIN TRANSACTION");

    // Loop through all of the values to add
    for ( let i = 0; i < values.length; i++ ) {
      let value = values[i];
      let columns = "";
      let data = "";

      // Loop through value's properties
      for ( let property in value ) {
        if ( value.hasOwnProperty(property) ) {

          // Check field is set in table schema
          let field = _findField(property, table.fields);

          if ( field !== undefined ) {
            columns += field.name + ", ";
            if ( field.type.toUpperCase() === "TEXT" ) {
              data += "'" + value[property] + "', ";
            }
            else {
              data += value[property] + ", ";
            }
          }
          else {
            let msg = "Field " + property + " not found in table schema for table " + table.name;
            log.warning("        WARNING: " + msg);
            errors.warning(msg, "DB File: " + db.filename, undefined);
          }

        }
      }

      // Trim last commas and spaces
      if ( columns.indexOf(", ") > -1 ) {
        columns = columns.substring(0, columns.length - 2);
      }
      if ( data.indexOf(", ") > -1 ) {
        data = data.substring(0, data.length - 2);
      }

      // Build and run SQL statement
      let sql = "INSERT INTO " + table.name + " (" + columns + ") VALUES (" + data + ");";
      db.exec(sql);
    }

    db.exec("COMMIT", function() {
      callback();
    });
  });
}




// ==== HELPER FUNCTIONS ===== //


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
 * Split a line from a source file into separate fields.  Remove all
 * double and single quotes from the field
 * @param {string} str The line from the source file
 * @param {string} [sep=,] The field separator
 * @returns {Array} List of parsed fields
 * @private
 */
function _split(str, sep=',') {

  // Split the String
  let items = split(str)[0];
  for ( let i = 0; i < items.length; i++ ) {
    items[i] = items[i].replace(/'/g, "");
  }

  // Return list of items
  return items;

}


/**
 * Find the data field in the table schema based on the
 * name or source_name of the field
 * @param {string} name Lookup table field name
 * @param {Object[]} fields RT Table Schema fields
 * @returns {object|undefined} RT Table Schema for matching field
 * or undefined if no match found.
 * @private
 */
function _findField(name, fields) {
  for ( let i = 0; i < fields.length; i++ ) {
    let field = fields[i];
    if ( field.name === name ) {
      return field;
    }
    else if ( field.source_name === name ) {
      return field;
    }
  }
  return undefined;
}




module.exports = {
  init: init,
  create: create,
  load: load,
  add: add
};