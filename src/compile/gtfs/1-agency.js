'use strict';

const build = require('../utils/build.js');

/**
 * gtfs_agency table definition
 * @type {RTTableSchema}
 * @private
 */
const TABLE = {
  sourceDirectory: "{{locations.gtfsDir}}",
  sourceFile: "agency.txt",
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


/**
 * Build gtfs_agency table
 * @type {buildTable}
 * @private
 */
function buildTable(db, agencyOptions, callback) {
  build.init(db, TABLE, agencyOptions, function() {
    callback();
  });
}





module.exports = buildTable;