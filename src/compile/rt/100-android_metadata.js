'use strict';

const config = require('../../../config.json');
const build = require('../utils/build.js');


/**
 * android_metadata table definition
 * @type {RTTableSchema}
 * @private
 */
const TABLE = {
  name: "android_metadata",
  fields: [
    {
      "name": "locale",
      "type": "TEXT",
      "attributes": "NOT NULL"
    }
  ]
};

/**
 * Initial values for table
 * @type {RTTableValues}
 * @private
 */
const VALUES = [
  {
    "locale": config.options.locale,
  }
];


/**
 * Build gtfs_directions table
 * @type {buildTable}
 * @private
 */
function buildTable(db, agencyOptions, callback) {
  build.create(db, TABLE, function() {
    build.add(db, TABLE, VALUES, function() {
      callback();
    });
  });
}



module.exports = buildTable;