'use strict';

const utils = require('../utils.js');
const chalk = require('chalk');
const error = function(text) {console.error(chalk.bold.red(text))};


// TABLE STRUCTURE
const TABLE = {
  source: "routes.txt",
  name: "gtfs_routes",
  fields: [
    {
      "name": "route_id",
      "type": "TEXT",
      "attributes": "PRIMARY KEY NOT NULL"
    },
    {
      "name": "agency_id",
      "type": "TEXT",
      "foreignKey": {
        "table": "gtfs_agency",
        "field": "agency_id"
      }
    },
    {
      "name": "route_short_name",
      "type": "TEXT"
    },
    {
      "name": "route_long_name",
      "type": "TEXT"
    },
    {
      "name": "route_desc",
      "type": "TEXT"
    },
    {
      "name": "route_type",
      "type": "INT"
    },
    {
      "name": "route_url",
      "type": "TEXT"
    },
    {
      "name": "route_color",
      "type": "TEXT",
      "attributes": "NOT NULL DEFAULT '333333'"
    },
    {
      "name": "route_text_color",
      "type": "TEXT",
      "attributes": "NOT NULL DEFAULT 'ffffff'"
    }
  ]
};



function run(db, gtfs_dir, callback) {
  utils.init(db, TABLE, gtfs_dir, function(err) {
    if ( err ) {
      error("       WARNING: " + err.message);
    }
    _checkRouteNames(db, callback);
  });
}


/**
 * Check Route Names: if route_short_name is empty, use the route_long_name
 * @param db The SQLite database being built
 * @param callback Compile callback function
 * @private
 */
function _checkRouteNames(db, callback) {
  console.log("        ... Checking route short names");

  let sql = "";
  db.each("SELECT route_short_name, route_long_name FROM " + TABLE.name + ";",
    function(err, row) {
      if ( !err ) {
        let short = row.route_short_name;
        let long = row.route_long_name;
        if ( short === undefined || short === '' ) {
          sql += "UPDATE " + TABLE.name + " SET route_short_name = '" + long + "' WHERE route_long_name = '" + long + "'; ";
        }
      }
    },
    function() {
      db.exec(sql, function(err) {
        if ( err ) {
          error("       WARNING: could not fix routes");
        }
        callback();
      });
    }
  );

}



module.exports = run;