'use strict';

const config = require('../../../config.json');
const build = require('../utils/build.js');
const log = require('../../helpers/log.js');

/**
 * gtfs_trips table definition
 * @type {RTTableSchema}
 * @private
 */
const TABLE = {
  name: config.tables.gtfs.trips,
  sourceDirectory: config.locations.directories.gtfs,
  sourceFile: "trips.txt",
  fields: [
    {
      "name": "route_id",
      "type": "TEXT",
      "attributes": "NOT NULL",
      "foreignKey": {
        "table": "gtfs_routes",
        "field": "route_id"
      }
    },
    {
      "name": "service_id",
      "type": "TEXT",
      "attributes": "NOT NULL",
      "index": true
    },
    {
      "name": "trip_id",
      "type": "TEXT",
      "attributes": "PRIMARY KEY NOT NULL",
      "index": true
    },
    {
      "name": "trip_headsign",
      "type": "TEXT"
    },
    {
      "name": "direction_id",
      "type": "INTEGER",
      "index": true,
      "foreignKey": {
        "table": "gtfs_directions",
        "field": "direction_id"
      }
    },
    {
      "name": "block_id",
      "type": "TEXT"
    },
    {
      "name": "shape_id",
      "type": "TEXT"
    },
    {
      "name": "wheelchair_accessible",
      "type": "INTEGER",
      "attributes": "DEFAULT 0",
      "source_name": "wheelchair_boarding"
    },
    {
      "name": "trip_short_name",
      "type": "TEXT"
    },
    {
      "name": "peak",
      "type": "INTEGER",
      "attributes": "DEFAULT 0"
    }
  ]
};


/**
 * Build gtfs_trips table
 * @type {buildTable}
 * @private
 */
function buildTable(db, agency, callback) {
  build.init(db, TABLE, agency, function() {
    _checkTripHeadsigns(db, function() {
      _setTripPeak(db, agency.agency, function() {
        callback();
      });
    });
  });
}


/**
 * Set trip head signs to "To <destination>"
 * @private
 */
function _checkTripHeadsigns(db, callback) {
  log("        ... Checking trip headsigns");

  db.all("SELECT trip_id FROM " + TABLE.name + ";",
    function(err, rows) {
      db.exec("BEGIN TRANSACTION", function() {
        _updateTripRow(db, rows, 0, function() {
          db.exec("COMMIT", function() {
            callback();
          });
        });
      })
    }
  );
}

/**
 * Update the trip_headsign field for the specified row
 * @param db RightTrackDB
 * @param rows Trip Rows
 * @param count Trip counter
 * @param callback Trip callback
 * @private
 */
function _updateTripRow(db, rows, count, callback) {
  if ( count < rows.length ) {
    let trip_id = rows[count].trip_id;

    // Get name of last stop
    db.get("SELECT stop_name FROM " + config.tables.gtfs.stops + " WHERE stop_id = (" +
      "SELECT stop_id FROM " + config.tables.gtfs.stop_times + " WHERE trip_id = '" + trip_id + "' AND stop_sequence = (" +
      "SELECT MAX(stop_sequence) FROM " + config.tables.gtfs.stop_times + " WHERE trip_id = '" + trip_id + "'" +
      ")" +
      ");",
      function(err, row) {

        // Update trip headsign = "To last_stop_name"
        db.exec("UPDATE " + config.tables.gtfs.trips + " SET trip_headsign = 'To " + row.stop_name + "' WHERE trip_id = '" + trip_id + "';",
          function() {
            _updateTripRow(db, rows, count+1, callback);
          }
        );

      }
    );

  }
  else {
    callback();
  }
}




module.exports = buildTable;