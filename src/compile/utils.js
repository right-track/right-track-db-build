'use strict';

const rl = require('readline');
const fs = require('fs');
const path = require('path');


function init(db, table, gtfs_dir, callback) {
  console.log("    ..." + table.name);

  // Create the Table
  create(db, table, function() {

    // Source File
    let file = path.normalize(gtfs_dir + "/" + table.source);

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


function create(db, table, callback) {

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



function load(db, table, file, callback) {
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






function _split(str) {
  let items = str.split(',');
  for ( let i = 0; i < items.length; i++ ) {
    let item = items[i];
    if (item.charAt(0) === '"' && item.charAt(item.length -1) === '"') {
      item = item.substr(1,item.length -2);
    }
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