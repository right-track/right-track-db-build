'use strict';

const config = require('../../../config.json');
const build = require('../utils/build.js');

/**
 * gtfs_shapes table definition
 * @type {RTTableSchema}
 * @private
 */
const TABLE = {
  name: config.tables.gtfs.shapes,
  sourceDirectory: config.locations.directories.gtfs,
  sourceFile: "shapes.txt",
  fields: [
    {
      "name": "shape_id",
      "type": "TEXT",
      "attributes": "NOT NULL"
    },
    {
      "name": "shape_pt_lat",
      "type": "NUMERIC",
      "attributes": "NOT NULL"
    },
    {
      "name": "shape_pt_lon",
      "type": "NUMERIC",
      "attributes": "NOT NULL"
    },
    {
      "name": "shape_pt_sequence",
      "type": "INTEGER",
      "attributes": "NOT NULL"
    },
    {
      "name": "shape_dist_traveled",
      "type": "NUMERIC"
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