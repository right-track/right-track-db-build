'use strict';

const build = require('../utils/build.js');

/**
 * rt_alt_stop_names table definition
 * @type {RTTableSchema}
 * @private
 */
const TABLE = {
  sourceDirectory: "{{locations.rtDir}}",
  sourceFile: "rt_alt_stop_names.csv",
  name: "rt_alt_stop_names",
  fields: [
    {
      "name": "stop_id",
      "type": "TEXT",
      "attributes": "NOT NULL",
      "index": true,
      "foreignKey": {
        "table": "gtfs_stops",
        "field": "stop_id"
      }
    },
    {
      "name": "alt_stop_name",
      "type": "TEXT",
      "attributes": "NOT NULL"
    }
  ]
};


/**
 * Build rt_alt_stop_names table
 * @type {buildTable}
 * @private
 */
function buildTable(db, agencyOptions, callback) {
  build.init(db, TABLE, agencyOptions, function() {
    callback();
  });
}





module.exports = buildTable;