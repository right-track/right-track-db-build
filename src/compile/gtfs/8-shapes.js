'use strict';

const config = require('../../../config.json');
const build = require('../utils/build.js');
const log = require('../../helpers/log.js');

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
    _removeInvalidPositions(db, function() {
      callback();
    });
  });
}


/**
 * Remove positions with invalid lat/lon
 * @private
 */
function _removeInvalidPositions(db, callback) {
  log("        ... Removing invalid positions");
  db.exec("DELETE FROM " + config.tables.gtfs.shapes + " WHERE shape_pt_lat < -90 OR shape_pt_lat > 90 OR shape_pt_lon < -180 OR shape_pt_lon > 180;", callback)
}




module.exports = buildTable;