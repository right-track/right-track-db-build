'use strict';

const readline = require('readline');
const config = require('../../../config.json');
const build = require('../utils/build.js');
const log = require('../../helpers/log.js');

/**
 * The maximum number of allowed hours in a day
 * @private
 */
const MAX_HOURS = 36;

/**
 * gtfs_stop_times table definition
 * @type {RTTableSchema}
 * @private
 */
const TABLE = {
  name: config.tables.gtfs.stop_times,
  sourceDirectory: config.locations.directories.gtfs,
  sourceFile: "stop_times.txt",
  fields: [
    {
      "name": "trip_id",
      "type": "TEXT",
      "attributes": "NOT NULL",
      "index": true,
      "foreignKey": {
        "table": "gtfs_trips",
        "field": "trip_id"
      }
    },
    {
      "name": "arrival_time",
      "type": "TEXT",
      "attributes": "NOT NULL"
    },
    {
      "name": "departure_time",
      "type": "TEXT",
      "attributes": "NOT NULL"
    },
    {
      "name": "stop_id",
      "type": "TEXT",
      "attributes": "NOT NULL",
      "index": true,
      "foreignKey": {
        "table": "gtfs_stops",
        "field": "stop_id"
      }
    },
    {
      "name": "stop_sequence",
      "type": "INTEGER",
      "attributes": "NOT NULL"
    },
    {
      "name": "stop_headsign",
      "type": "INTEGER"
    },
    {
      "name": "pickup_type",
      "type": "INTEGER",
      "attributes": "DEFAULT 0"
    },
    {
      "name": "drop_off_type",
      "type": "INTEGER",
      "attributes": "DEFAULT 0"
    },
    {
      "name": "shape_dist_traveled",
      "type": "DOUBLE PRECISION"
    },
    {
      "name": "timepoint",
      "type": "INTEGER"
    },
    {
      "name": "track",
      "type": "TEXT"
    },
    {
      "name": "note_id",
      "type": "TEXT"
    },
    {
      "name": "arrival_time_seconds",
      "type": "INTEGER",
      "index": true
    },
    {
      "name": "departure_time_seconds",
      "type": "INTEGER",
      "index": true
    }
  ]
};


/**
 * Build gtfs_stop_times table
 * @type {buildTable}
 * @private
 */
function buildTable(db, agency, callback) {
  build.init(db, TABLE, agency, function() {
    _setDefaults(db, function() {
      _calcArrivalSecs(db, function() {
        _calcDepartureSecs(db, function() {
          _fixTimes(db, function() {
            callback();
          });
        });
      });
    });
  });
}


/**
 * Set Default Pickup and Drop Off Types, if not set
 * @private
 */
function _setDefaults(db, callback) {
  log("        ... Setting default pickup/drop off types");

  db.exec("UPDATE " + TABLE.name + " SET drop_off_type = 0 WHERE drop_off_type IS NULL;", function() {
    db.exec("UPDATE " + TABLE.name + " SET pickup_type = 0 WHERE pickup_type IS NULL;", function() {
      callback();
    });
  });
}


/**
 * Calculate the arrival_time_seconds field from the arrival_time field
 * @private
 */
function _calcArrivalSecs(db, callback) {
  process.stdout.write("        ... Calculating arrival seconds ");

  db.all("SELECT DISTINCT arrival_time FROM " + TABLE.name + ";",
    function(err, rows) {
      db.exec("BEGIN TRANSACTION", function() {
        _updateArrivalRow(db, rows, 0, function() {
          db.exec("COMMIT", function() {
            readline.cursorTo(process.stdout, 0);
            process.stdout.write("        ... Calculating arrival seconds\n");
            callback();
          })
        });
      })
    }
  );

}

/**
 * Update specified row with the arrival_time_seconds
 * @param db RightTrackDB
 * @param rows Rows of arrival times
 * @param count Arrival time counter
 * @param callback Arrival time callback
 * @private
 */
function _updateArrivalRow(db, rows, count, callback) {
  let percent = Math.floor((count/rows.length)*100);
  readline.cursorTo(process.stdout, 0);
  process.stdout.write("        ... Calculating arrival seconds (" + percent + "%)");

  if ( count < rows.length ) {
    let time = rows[count].arrival_time;
    let secs = _convertTimeToSecs(time);
    db.exec("UPDATE " + TABLE.name + " SET arrival_time_seconds = " + secs + " WHERE arrival_time = '" + time + "';",
      function() {
        _updateArrivalRow(db, rows, count+1, callback);
      }
    );
  }
  else {
    callback();
  }
}


/**
 * Calculate the departure_time_seconds field from the departure_time field
 * @private
 */
function _calcDepartureSecs(db, callback) {
  process.stdout.write("        ... Calculating departure seconds ");

  db.all("SELECT DISTINCT departure_time FROM " + TABLE.name + ";",
    function(err, rows) {
      db.exec("BEGIN TRANSACTION", function() {
        _updateDepartureRow(db, rows, 0, function() {
          db.exec("COMMIT", function() {
            readline.cursorTo(process.stdout, 0);
            process.stdout.write("        ... Calculating departure seconds\n");
            callback();
          });
        });
      });
    }
  );

}

/**
 * Update the specified row with the departure_time_seconds
 * @param db RightTrackDB
 * @param rows Rows of departure times
 * @param count Departure time counter
 * @param callback Departure time callback
 * @private
 */
function _updateDepartureRow(db, rows, count, callback) {
  let percent = Math.floor((count/rows.length)*100);
  readline.cursorTo(process.stdout, 0);
  process.stdout.write("        ... Calculating departure seconds (" + percent + "%)");

  if ( count < rows.length ) {
    let time = rows[count].departure_time;
    let secs = _convertTimeToSecs(time);
    db.exec("UPDATE " + TABLE.name + " SET departure_time_seconds = " + secs + " WHERE departure_time = '" + time + "';",
      function() {
        _updateDepartureRow(db, rows, count+1, callback);
      }
    );
  }
  else {
    callback();
  }
}


/**
 * Convert time in HH:mm:ss format to # of seconds since midnight
 * @param time
 * @returns {number}
 * @private
 */
function _convertTimeToSecs(time) {
  let parts = time.split(':');
  return parts[0]*3600+parts[1]*60+parts[2]*1;
}


/**
 * Fix any times that have an hour greater than MAX_HOURS
 * @private
 */
 function _fixTimes(db, callback) {
  log("        ... Fixing times with hours greater than " + MAX_HOURS);
  let max_seconds = MAX_HOURS*3600;

  db.all("SELECT trip_id, stop_id, arrival_time, departure_time, arrival_time_seconds, departure_time_seconds FROM " + TABLE.name + " WHERE arrival_time_seconds > " + max_seconds + " OR departure_time_seconds > " + max_seconds + ";",
    function(err, rows) {
      if ( rows && rows.length > 0 ) {
        log("            Fixing " + rows.length + " stop_times");
        db.exec("BEGIN TRANSACTION", function() {
          _updateTimeRow(db, rows, 0, function() {
            db.exec("COMMIT", function() {
              return callback();
            });
          });
        });
      }
      else {
        return callback();
      }
    }
  );
}


/**
 * Fix the departure/arrival times for the specified row
 * @param db RightTrackDB
 * @param rows Rows of times to fix
 * @param count Row counter
 * @param callback callback function
 * @private
 */
 function _updateTimeRow(db, rows, count, callback) {
  if ( count < rows.length ) {
    let row = rows[count];
    let tid = row.trip_id;
    let sid = row.stop_id;
    let at = row.arrival_time;
    let dt = row.departure_time;
    let as = row.arrival_time_seconds;
    let ds = row.departure_time_seconds;

    let nas = as - (24*3600);
    let nds = ds - (24*3600);
    let nah = Math.floor(nas/(3600));
    let ndh = Math.floor(nds/(3600));
    let nat = at.replace(/^[0-9]+:/, `${nah}:`);
    let ndt = dt.replace(/^[0-9]+:/, `${ndh}:`);

    db.exec("UPDATE " + TABLE.name + " SET arrival_time = '" + nat + "', departure_time = '" + ndt + "', arrival_time_seconds = " + nas + ", departure_time_seconds = " + nds + " WHERE trip_id = '" + tid + "' AND stop_id = '" + sid + "';",
      function() {
        _updateTimeRow(db, rows, count+1, callback);
      }
    );
  }
  else {
    return callback();
  }
}


module.exports = buildTable;