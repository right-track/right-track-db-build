'use strict';

const utils = require('../utils.js');
const chalk = require('chalk');
const error = function(text) {console.error(chalk.bold.red(text))};


// TABLE STRUCTURE
const TABLE = {
  source: "agency.txt",
  name: "gtfs_agency",
  fields: [
    {
      "name": "agency_id",
      "type": "TEXT",
      "attributes": "PRIMARY KEY NOT NULL"
    },
    {
      "name": "agency_name",
      "type": "TEXT",
      "attributes": "NOT NULL"
    },
    {
      "name": "agency_url",
      "type": "TEXT",
      "attributes": "NOT NULL"
    },
    {
      "name": "agency_timezone",
      "type": "TEXT",
      "attributes": "NOT NULL"
    },
    {
      "name": "agency_lang",
      "type": "TEXT"
    },
    {
      "name": "agency_phone",
      "type": "TEXT"
    },
    {
      "name": "agency_fare_url",
      "type": "TEXT"
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