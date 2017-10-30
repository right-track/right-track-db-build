'use strict';

/**
 * Database compilation utility functions
 * @module /compile/utils
 */

const rl = require('readline');
const fs = require('fs');
const path = require('path');


/**
 * Initialize the Table in the database.  This will drop an existing table,
 * create a new one (along with any specified indices and/or foreign key
 * relationships) and import the
 * @param {sqlite3} db SQlite Database being built
 * @param {RTTableSchema} table The Right Track Table Schema
 * @param {string} source_dir The directory of the source file
 * @param {function} callback Callback function(err) called when init is finished
 */
function init(db, table, source_dir, callback) {

  // Create the Table
  create(db, table, function() {

    // Source File
    let file = path.normalize(source_dir + "/" + table.source);

    // Make sure source exists
    if ( !fs.existsSync(file) ) {
      callback(new Error("Source file does not exist"));
    }

    // Import the GTFS file
    else {
      load(db, table, file, callback);
    }

  });

}


/**
 * Create the table in the database
 * @param {sqlite3} db SQLite Database being built
 * @param {RTTableSchema} table The Right Track Table Schema
 * @param {function} callback Callback function(err) called when create is finished
 */
function create(db, table, callback) {
  console.log("        ... Creating " + table.name);

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
  db.serialize(function() {
    db.exec(drop);
    db.exec(create);
    db.exec(indices, function() {
      callback();
    });
  });

}


/**
 * Load the source file into the database
 * @param {sqlite3} db SQLite database being built
 * @param {RTTableSchema} table The Right Track Table Schema
 * @param {string} file Full path to source file
 * @param {function} callback Callback function(err) called when load is finished
 */
function load(db, table, file, callback) {
  console.log("        ... Importing " + path.basename(file));

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
    if ( !readHeaders ) {
      headers = _split(line);
      readHeaders = true;
    }
    else {
      let items = _split(line);

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
        if ( i < items.length-1) {
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
  });

  rd.on('close', function() {
    db.exec("COMMIT;", function() {
      callback();
    });
  });
}


/**
 * Split a line from a source file into separate fields.  Remove all
 * double and single quotes from the field
 * @param {string} str The line from the source file
 * @returns {Array} List of parsed fields
 * @private
 */
function _split(str) {
  let items = str.split(',');
  for ( let i = 0; i < items.length; i++ ) {
    let item = items[i];
    if ( item.indexOf("\"") > -1 ) {
      item = item.replace(/"/g, "");
    }
    // if (item.charAt(0) === '"' && item.charAt(item.length -1) === '"') {
    //   item = item.substr(1,item.length -2);
    // }
    if ( item.indexOf("'") > -1 ) {
      item = item.replace(/'/g, "");
    }
    items[i] = item;
  }
  return items;
}


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
  init: init
};