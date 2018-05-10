'use strict';

const config = require('../../../config.json');
const build = require('../utils/build.js');

/**
 * rt_properties table definition
 * @type {RTTableSchema}
 * @private
 */
const TABLE = {
  name: config.tables.rt.properties,
  sourceDirectory: config.locations.directories.rt,
  sourceFile: "rt_properties.csv",
  fields: [
    {
      "name": "name",
      "type": "TEXT",
      "attributes": "NOT NULL"
    },
    {
      "name": "value",
      "type": "TEXT"
    }
  ]
};


/**
 * Build rt_properties table
 * @type {buildTable}
 * @private
 */
function buildTable(db, agencyOptions, callback) {
  build.init(db, TABLE, agencyOptions, function() {
    callback();
  });
}





module.exports = buildTable;