'use strict';

const config = require('../../../config.json');
const build = require('../utils/build.js');

/**
 * rt_stops_extra table definition
 * @type {RTTableSchema}
 * @private
 */
const TABLE = {
  name: config.tables.rt.stops_extra,
  sourceDirectory: config.locations.rtDir,
  sourceFile: "rt_stops_extra.csv",
  fields: [
    {
      "name": "stop_id",
      "type": "TEXT",
      "attributes": "PRIMARY KEY NOT NULL",
      "foreignKey": {
        "table": "gtfs_stops",
        "field": "stop_id"
      }
    },
    {
      "name": "status_id",
      "type": "TEXT",
      "attributes": "NOT NULL",
      "index": true
    },
    {
      "name": "display_name",
      "type": "TEXT",
      "attributes": "NOT NULL"
    },
    {
      "name": "zone_id",
      "type": "INTEGER"
    },
    {
      "name": "transfer_weight",
      "type": "INTEGER",
      "index": true
    }
  ]
};


/**
 * Build rt_stops_extra table
 * @type {buildTable}
 * @private
 */
function buildTable(db, agencyOptions, callback) {
  build.init(db, TABLE, agencyOptions, function() {
    callback();
  });
}





module.exports = buildTable;