'use strict';

const readline = require('readline');
const fs = require('fs');
const path = require('path');
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


/**
 * Set Trip default peak status
 *
 * Peak Values:
 * 0 = never peak
 * 1 = always peak (excluding holidays)
 * 2 = peak on weekdays (excluding holidays)
 * @param db RightTrackDB (SQLite3 implementation)
 * @param agency The RightTrackAgency implementation being used to build the Database
 * @param callback Callback function
 * @private
 */
function _setTripPeak(db, agency, callback) {
  process.stdout.write("        ... Setting Trip Peak Status ");

  // Peak Function location
  let location = path.normalize(agency.moduleDirectory + '/' + config.locations.scripts.peak);

  // Peak Function Exists...
  if ( fs.existsSync(location) ) {

    // Get All of the Trips
    db.all("SELECT trip_id FROM " + config.tables.gtfs.trips + ";", function(err, rows) {
      db.exec("BEGIN TRANSACTION", function() {

        // Update Each Trip
        _updateTripPeak(db, agency, rows, 0, function() {
          db.exec("COMMIT", function() {
            _finish();
          });
        });

      });
    });

  }

  // Peak Function Not Implemented...
  else {
    readline.cursorTo(process.stdout, 0);
    process.stdout.write("        ... Setting Trip Peak Status (SKIPPING)");
    _finish();
  }


  /**
   * Finish Setting Trip Peak Status
   * @private
   */
  function _finish() {
    readline.cursorTo(process.stdout, 0);
    process.stdout.write("        ... Setting Trip Peak Status\n");
    callback();
  }

}


/**
 * Update the Trip Peak Status for the specified Trip using the
 * specified peak calculator function
 * @param db RightTrackDB (SQLite3 implementation)
 * @param agency The RightTrackAgency implementation being used to build the Database
 * @param rows Rows of Trips
 * @param count Current Trip
 * @param callback Callback function
 * @private
 */
function _updateTripPeak(db, agency, rows, count, callback) {
  let percent = Math.floor((count/rows.length)*100);
  readline.cursorTo(process.stdout, 0);
  process.stdout.write("        ... Setting Trip Peak Status (" + percent + "%)");

  // Continue...
  if ( count < rows.length ) {

    // Get the Peak Calc Function
    let location = path.normalize(agency.moduleDirectory + '/' + config.locations.scripts.peak);
    let peakCalc = require(location);

    // Determine Trip Peak Status
    peakCalc(db, rows[count].trip_id, function(peak) {
      if ( peak > 0 ) {
        db.exec("UPDATE " + config.tables.gtfs.trips + " SET peak = " + peak + " WHERE trip_id = '" + rows[count].trip_id + "';", function () {
          _next();
        });
      }
      else {
        _next();
      }
    });

  }

  // Return...
  else {
    return callback();
  }

  /**
   * Update the Next Trip
   * @private
   */
  function _next() {
    _updateTripPeak(db, agency, rows, count+1, callback);
  }
}




module.exports = buildTable;