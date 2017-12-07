'use strict';

const config = require('../../../config.json');
const build = require('../utils/build.js');
const log = require('../../helpers/log.js');

/**
 * gtfs_routes table definition
 * @type {RTTableSchema}
 * @private
 */
const TABLE = {
  name: config.tables.gtfs.routes,
  sourceDirectory: config.locations.gtfsDir,
  sourceFile: "routes.txt",
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



/**
 * Build gtfs_routes table
 * @type {buildTable}
 * @private
 */
function buildTable(db, agency, callback) {
  build.init(db, TABLE, agency, function() {
    _checkRouteNames(db, function() {
      callback();
    });
  });
}


/**
 * Check Route Names: if route_short_name is empty, use the route_long_name
 * @param db The SQLite database being built
 * @param callback Compile callback function
 * @private
 */
function _checkRouteNames(db, callback) {
  log("        ... Checking route short names");

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
      db.exec(sql, function() {
        callback();
      });
    }
  );

}



module.exports = buildTable;