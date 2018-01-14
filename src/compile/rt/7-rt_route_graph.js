'use strict';

const readline = require('readline');
const config = require('../../../config.json');
const build = require('../utils/build.js');

/**
 * rt_route_graph table definition
 * @type {RTTableSchema}
 * @private
 */
const TABLE = {
  name: config.tables.rt.route_graph,
  fields: [
    {
      "name": "line_id",
      "type": "INTEGER",
      "attributes": "PRIMARY KEY"
    },
    {
      "name": "direction_id",
      "type": "INTEGER",
      "attributes": "NOT NULL"
    },
    {
      "name": "stop1_id",
      "type": "TEXT",
      "attributes": "NOT NULL"
    },
    {
      "name": "stop2_id",
      "type": "TEXT",
      "attributes": "NOT NULL"
    }
  ]
};


/**
 * Build rt_route_graph table
 * @type {buildTable}
 * @private
 */
function buildTable(db, agencyOptions, callback) {
  build.create(db, TABLE, function() {
    _build(db, callback);
  });
}


/**
 * Start building the route graph
 * @private
 */
function _build(db, callback) {
  process.stdout.write("        ... Building Route Graph ");

  // Get all trips from gtfs_trips table
  db.all("SELECT trip_id FROM " + config.tables.gtfs.trips + ";",
    function(err, rows) {
      db.exec("BEGIN TRANSACTION", function() {

        // Process the first trip
        _processTrip(db, rows, 0, function() {

          // All trips finished, commit and call callback
          db.exec("COMMIT", function() {
            readline.cursorTo(process.stdout, 0);
            process.stdout.write("        ... Building Route Graph\n");
            callback();
          });

        });
      });
    }
  );

}


/**
 * Process a Trip for the route graph
 * @param db RightTrackDB
 * @param rows Rows of Trips
 * @param count Row Counter
 * @param callback Trip callback
 * @private
 */
function _processTrip(db, rows, count, callback) {
  let percent = Math.floor((count/rows.length)*100);
  readline.cursorTo(process.stdout, 0);
  process.stdout.write("        ... Building Route Graph (" + percent + "%)");

  // Process Trip
  if ( count < rows.length ) {
    let trip = rows[count].trip_id;

    // Get all stops and direction for this trip
    let sql = "SELECT stop_id, direction_id FROM " + config.tables.gtfs.stop_times + ", " + config.tables.gtfs.trips + " " +
      "WHERE " + config.tables.gtfs.stop_times + ".trip_id=" + config.tables.gtfs.trips + ".trip_id AND " +
      config.tables.gtfs.stop_times + ".trip_id='" + trip + "' ORDER BY stop_sequence;";

    // Perform query and process each of the stops
    db.all(sql, function(err, stops) {

      // Start processing the 2nd stop
      _processStop(db, stops, 1, _nextTrip);

    });

  }

  // All Trips Processed, finish
  else {
    _finish();
  }


  /**
   * Start processing the next trip
   * @private
   */
  function _nextTrip() {
    _processTrip(db, rows, count+1, callback);
  }

  /**
   * Finished processing all trips
   * @private
   */
  function _finish() {
    callback();
  }
}


/**
 * Process a Stop on a Trip for the route graph
 * @param db RightTrackDB
 * @param rows Rows of Stops
 * @param count Stop counter
 * @param callback Stop callback
 * @private
 */
function _processStop(db, rows, count, callback) {

  // Process Next Stop
  if ( count < rows.length ) {

    // Start processing with the 2nd Stop...
    if ( count > 0 ) {
      let direction = rows[count].direction_id;
      let stop = rows[count].stop_id;
      let prevStop = rows[count-1].stop_id;

      // Check for existing connection
      let sql = "SELECT line_id FROM " + TABLE.name + " WHERE (stop1_id='" + prevStop + "' " +
        "AND stop2_id='" + stop + "' AND direction_id=" + direction + ");";

      // Perform query
      db.get(sql, function(err, row) {
        if ( !err ) {

          // If not found...
          if ( row === undefined ) {

            // Add new connection
            let insert = "INSERT INTO " + TABLE.name + " (direction_id, stop1_id, stop2_id) VALUES " +
              "(" + direction + ", '" + prevStop + "', '" + stop + "');";

            // Perform insert, process next stop
            db.exec(insert, _nextStop);

          }

          // Process the next stop
          else {
            _nextStop();
          }

        }
      });
    }

    // Skip the first stop
    else {
      _nextStop();
    }
  }

  // Done processing stops...
  else {
    _finish();
  }


  /**
   * Start processing the next stop
   * @private
   */
  function _nextStop() {
    _processStop(db, rows, count+1, callback);
  }

  /**
   * Finished processing all stops
   * @private
   */
  function _finish() {
    callback();
  }
}


module.exports = buildTable;