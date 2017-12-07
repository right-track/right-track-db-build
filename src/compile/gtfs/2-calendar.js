'use strict';

const config = require('../../../config.json');
const build = require('../utils/build.js');

/**
 * gtfs_calendar table definition
 * @type {RTTableSchema}
 * @private
 */
const TABLE = {
  name: config.tables.gtfs.calendar,
  sourceDirectory: config.locations.gtfsDir,
  sourceFile: "calendar.txt",
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




/**
 * Build gtfs_calendar table
 * @type {buildTable}
 * @private
 */
function buildTable(db, agencyOptions, callback) {
  build.init(db, TABLE, agencyOptions, function() {
    callback();
  });
}





module.exports = buildTable;