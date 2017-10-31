'use strict';

const build = require('../utils/build.js');
const chalk = require('chalk');
const error = function(text) {console.error(chalk.bold.red(text))};


// TABLE STRUCTURE
const TABLE = {
  sourceDirectory: "{{locations.gtfsDir}}",
  sourceFile: "trips.txt",
  name: "gtfs_trips",
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
    }
  ]
};



function buildTable(db, agency, callback) {
  build.init(db, TABLE, agency, function(err) {
    if ( err ) {
      error("        WARNING: " + err.message);
    }
    _checkTripHeadsigns(db, callback);
  });
}


function _checkTripHeadsigns(db, callback) {
  console.log("        ... Checking trip headsigns");

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

function _updateTripRow(db, rows, count, callback) {
  if ( count < rows.length ) {
    let trip_id = rows[count].trip_id;

    // Get name of last stop
    db.get("SELECT stop_name FROM gtfs_stops WHERE stop_id = (" +
      "SELECT stop_id FROM gtfs_stop_times WHERE trip_id = '" + trip_id + "' AND stop_sequence = (" +
      "SELECT MAX(stop_sequence) FROM gtfs_stop_times WHERE trip_id = '" + trip_id + "'" +
      ")" +
      ");",
      function(err, row) {

        // Update trip headsign = "To last_stop_name"
        db.exec("UPDATE " + TABLE.name + " SET trip_headsign = 'To " + row.stop_name + "' WHERE trip_id = '" + trip_id + "';",
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