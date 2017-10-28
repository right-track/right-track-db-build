'use strict';

const utils = require('../utils.js');
const chalk = require('chalk');
const error = function(text) {console.error(chalk.bold.red(text))};

// TABLE STRUCTURE
const TABLE = {
  source: "calendar.txt",
  name: "gtfs_calendar",
  fields: [
    {
      "name": "service_id",
      "type": "TEXT",
      "attributes": "PRIMARY KEY NOT NULL"
    },
    {
      "name": "monday",
      "type": "INTEGER",
      "attributes": "DEFAULT 0"
    },
    {
      "name": "tuesday",
      "type": "INTEGER",
      "attributes": "DEFAULT 0"
    },
    {
      "name": "wednesday",
      "type": "INTEGER",
      "attributes": "DEFAULT 0"
    },
    {
      "name": "thursday",
      "type": "INTEGER",
      "attributes": "DEFAULT 0"
    },
    {
      "name": "friday",
      "type": "INTEGER",
      "attributes": "DEFAULT 0"
    },
    {
      "name": "saturday",
      "type": "INTEGER",
      "attributes": "DEFAULT 0"
    },
    {
      "name": "sunday",
      "type": "INTEGER",
      "attributes": "DEFAULT 0"
    },
    {
      "name": "start_date",
      "type": "INTEGER",
      "attributes": "NOT NULL"
    },
    {
      "name": "end_date",
      "type": "INTEGER",
      "attributes": "NOT NULL"
    }
  ]
};



function run(db, gtfs_dir, callback) {
  utils.init(db, TABLE, gtfs_dir, function(err) {
    if ( err ) {
      error("       WARNING: " + err.message);
    }
    callback();
  });
}





module.exports = run;