'use strict';

const config = require('../../../config.json');
const build = require('../utils/build.js');

/**
 * rt_line_graph table definition
 * @type {RTTableSchema}
 * @private
 */
const TABLE = {
  name: config.tables.rt.line_graph,
  sourceDirectory: config.locations.directories.rt,
  sourceFile: "rt_line_graph.csv",
  fields: [
    {
      "name": "line_id",
      "type": "INTEGER",
      "attributes": "PRIMARY KEY"
    },
    {
      "name": "stop1_id",
      "type": "TEXT",
      "attributes": "NOT NULL",
      "index": true,
      "foreignKey": {
        "table": "gtfs_stops",
        "field": "stop_id"
      }
    },
    {
      "name": "stop2_id",
      "type": "TEXT",
      "attributes": "NOT NULL",
      "index": true,
      "foreignKey": {
        "table": "gtfs_stops",
        "field": "stop_id"
      }
    }
  ]
};


/**
 * Build rt_line_graph table
 * @type {buildTable}
 * @private
 */
function buildTable(db, agencyOptions, callback) {
  build.init(db, TABLE, agencyOptions, function() {
    callback();
  });
}





module.exports = buildTable;