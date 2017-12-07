'use strict';

const config = require('../../../config.json');
const build = require('../utils/build.js');

/**
 * gtfs_calendar_dates table definition
 * @type {RTTableSchema}
 * @private
 */
const TABLE = {
  name: config.tables.gtfs.calendar_dates,
  sourceDirectory: config.locations.gtfsDir,
  sourceFile: "calendar_dates.txt",
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



/**
 * Build gtfs_calendar_dates table
 * @type {buildTable}
 * @private
 */
function buildTable(db, agencyOptions, callback) {
  build.init(db, TABLE, agencyOptions, function() {
    callback();
  });
}






module.exports = buildTable;