'use strict';

const utils = require('../utils.js');
const chalk = require('chalk');
const error = function(text) {console.error(chalk.bold.red(text))};

// TABLE STRUCTURE
const TABLE = {
  source: "calendar_dates.txt",
  name: "gtfs_calendar_dates",
  fields: [
    {
      "name": "service_id",
      "type": "TEXT",
      "attributes": "NOT NULL"
    },
    {
      "name": "date",
      "type": "INTEGER",
      "attributes": "NOT NULL"
    },
    {
      "name": "exception_type",
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