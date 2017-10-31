'use strict';

const build = require('../utils/build.js');
const chalk = require('chalk');
const error = function(text) {console.error(chalk.bold.red(text))};


// TABLE STRUCTURE
const TABLE = {
  sourceDirectory: "{{locations.gtfsDir}}",
  sourceFile: "stops.txt",
  name: "gtfs_stops",
  fields: [
    {
      "name": "stop_id",
      "type": "TEXT",
      "attributes": "PRIMARY KEY NOT NULL"
    },
    {
      "name": "stop_name",
      "type": "TEXT",
      "attributes": "NOT NULL"
    },
    {
      "name": "stop_desc",
      "type": "TEXT"
    },
    {
      "name": "stop_lat",
      "type": "DOUBLE PRECISION",
      "attributes": "NOT NULL"
    },
    {
      "name": "stop_lon",
      "type": "DOUBLE PRECISION",
      "attributes": "NOT NULL"
    },
    {
      "name": "zone_id",
      "type": "INTEGER"
    },
    {
      "name": "stop_url",
      "type": "TEXT"
    },
    {
      "name": "stop_code",
      "type": "TEXT"
    },
    {
      "name": "wheelchair_boarding",
      "type": "INTEGER",
      "attributes": "DEFAULT 0",
      "source_name": "wheelchair_accessible"
    },
    {
      "name": "stop_street",
      "type": "TEXT"
    },
    {
      "name": "stop_city",
      "type": "TEXT"
    },
    {
      "name": "stop_region",
      "type": "TEXT"
    },
    {
      "name": "stop_postcode",
      "type": "TEXT"
    },
    {
      "name": "stop_country",
      "type": "TEXT"
    },
    {
      "name": "location_type",
      "type": "INTEGER"
    },
    {
      "name": "parent_station",
      "type": "TEXT"
    },
    {
      "name": "stop_timezone",
      "type": "TEXT"
    }
  ]
};



function buildTable(db, agency, callback) {
  build.init(db, TABLE, agency, function(err) {
    if ( err ) {
      error("       WARNING: " + err.message);
    }
    callback();
  });
}





module.exports = buildTable;