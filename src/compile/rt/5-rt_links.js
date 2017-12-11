'use strict';

const config = require('../../../config.json');
const build = require('../utils/build.js');

/**
 * rt_links table definition
 * @type {RTTableSchema}
 * @private
 */
const TABLE = {
  name: config.tables.rt.links,
  sourceDirectory: config.locations.directories.rt,
  sourceFile: "rt_links.csv",
  separator: '|',
  fields: [
    {
      "name": "link_category_title",
      "type": "TEXT",
      "attributes": "NOT NULL"
    },
    {
      "name": "link_title",
      "type": "TEXT",
      "attributes": "NOT NULL"
    },
    {
      "name": "link_description",
      "type": "TEXT"
    },
    {
      "name": "link_url",
      "type": "TEXT",
      "attributes": "NOT NULL"
    }
  ]
};


/**
 * Build rt_links table
 * @type {buildTable}
 * @private
 */
function buildTable(db, agencyOptions, callback) {
  build.init(db, TABLE, agencyOptions, function() {
    callback();
  });
}





module.exports = buildTable;