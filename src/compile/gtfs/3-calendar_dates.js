'use strict';

const build = require('../utils/build.js');
const chalk = require('chalk');
const error = function(text) {console.error(chalk.bold.red(text))};

// TABLE STRUCTURE
const TABLE = {
  sourceDirectory: "{{locations.gtfsDir}}",
  sourceFile: "calendar_dates.txt",
  name: "gtfs_calendar_dates",
  fields: [
    {
      "name": "service_id",
      "type": "TEXT",
      "attributes": "NOT NULL",
      "index": true
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



function buildTable(db, agency, callback) {
  build.init(db, TABLE, agency, function(err) {
    if ( err ) {
      error("       WARNING: " + err.message);
    }
    callback();
  });
}





module.exports = buildTable;