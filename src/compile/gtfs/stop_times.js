'use strict';

const utils = require('../utils.js');
const chalk = require('chalk');
const error = function(text) {console.error(chalk.bold.red(text))};


// TABLE STRUCTURE
const TABLE = {
  source: "stop_times.txt",
  name: "gtfs_stop_times",
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
      "name": "arrival_time_seconds",
      "type": "INTEGER"
    },
    {
      "name": "departure_time_seconds",
      "type": "INTEGER"
    }
  ]
};



function run(db, gtfs_dir, callback) {
  utils.init(db, TABLE, gtfs_dir, function(err) {
    if ( err ) {
      error("       WARNING: " + err.message);
    }

    // Calculate arrival and departure seconds
    _calcArrivalSecs(db, function() {
      _calcDepartureSecs(db, callback);
    });

  });
}


function _calcArrivalSecs(db, callback) {
  console.log("       ...checking arrival seconds");

  db.all("SELECT DISTINCT arrival_time FROM " + TABLE.name + ";",
    function(err, rows) {
      db.exec("BEGIN TRANSACTION", function() {
        _updateArrivalRow(db, rows, 0, function() {
          db.exec("COMMIT", function() {
            callback();
          })
        });
      })
    }
  );

}

function _updateArrivalRow(db, rows, count, callback) {
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


function _calcDepartureSecs(db, callback) {
  console.log("       ...checking departure seconds");

  db.all("SELECT DISTINCT departure_time FROM " + TABLE.name + ";",
    function(err, rows) {
      db.exec("BEGIN TRANSACTION", function() {
        _updateDepartureRow(db, rows, 0, function() {
          db.exec("COMMIT", function() {
            callback();
          })
        });
      })
    }
  );

}

function _updateDepartureRow(db, rows, count, callback) {
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





function _convertTimeToSecs(time) {
  let parts = time.split(':');
  return parts[0]*3600+parts[1]*60+parts[2]*1;
}





module.exports = run;