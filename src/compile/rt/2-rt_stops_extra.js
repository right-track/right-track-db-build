'use strict';

const config = require('../../../config.json');
const build = require('../utils/build.js');
const log = require('../../helpers/log.js');

/**
 * rt_stops_extra table definition
 * @type {RTTableSchema}
 * @private
 */
const TABLE = {
  name: config.tables.rt.stops_extra,
  sourceDirectory: config.locations.directories.rt,
  sourceFile: "rt_stops_extra.csv",
  fields: [
    {
      "name": "stop_id",
      "type": "TEXT",
      "attributes": "PRIMARY KEY NOT NULL",
      "foreignKey": {
        "table": "gtfs_stops",
        "field": "stop_id"
      }
    },
    {
      "name": "status_id",
      "type": "TEXT",
      "attributes": "NOT NULL",
      "index": true
    },
    {
      "name": "display_name",
      "type": "TEXT",
      "attributes": "NOT NULL"
    },
    {
      "name": "zone_id",
      "type": "INTEGER"
    },
    {
      "name": "transfer_weight",
      "type": "INTEGER",
      "index": true
    }
  ]
};


/**
 * Build rt_stops_extra table
 * @type {buildTable}
 * @private
 */
function buildTable(db, agencyOptions, callback) {
  build.init(db, TABLE, agencyOptions, function() {
    _calcTransferWeight(db, callback);
  });
}


/**
 * Calculate Transfer Weights for each stop in table
 * @private
 */
function _calcTransferWeight(db, callback) {
  log("        ... Adding transfer_weight");

  // Select all Stop IDs from the Table
  db.all("SELECT stop_id FROM " + TABLE.name + ";",
    function(err, rows) {
      db.exec("BEGIN TRANSACTION", function() {

        // Start updating the first stop
        _updateStop(db, rows, 0, function() {

          // All stops finished, commit and call callback
          db.exec("COMMIT", function() {
            callback();
          });

        });
      });
    }
  );

}

/**
 * Calculate the Transfer Weight for the specified stop and update the table
 * @param db RightTrackDB
 * @param rows list of stops
 * @param count current stop to update
 * @param callback final callback
 * @private
 */
function _updateStop(db, rows, count, callback) {
  if ( count < rows.length ) {
    let stopId = rows[count].stop_id;

    // Get the weight as count of trips
    db.get("SELECT COUNT(trip_id) AS weight FROM " + config.tables.gtfs.stop_times + " WHERE stop_id='" + stopId + "';",
      function(err, row) {
        if ( !err ) {
          let weight = row.weight;

          // Update the Stop
          db.exec("UPDATE " + config.tables.rt.stops_extra + " SET transfer_weight=" + weight + " WHERE stop_id='" + stopId + "';",
            function() {
              _updateStop(db, rows, count+1, callback);
            }
          );

        }
      }
    );

  }
  else {
    callback();
  }
}


module.exports = buildTable;