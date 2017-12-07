'use strict';

const build = require('../utils/build.js');

/**
 * rt_holidays table definition
 * @type {RTTableSchema}
 * @private
 */
const TABLE = {
  sourceDirectory: "{{locations.rtDir}}",
  sourceFile: "rt_holidays.csv",
  name: "rt_holidays",
  fields: [
    {
      "name": "date",
      "type": "INTEGER",
      "attributes": "PRIMARY KEY NOT NULL"
    },
    {
      "name": "holiday_name",
      "type": "TEXT",
      "attributes": "NOT NULL"
    },
    {
      "name": "peak",
      "type": "INTEGER"
    },
    {
      "name": "service_info",
      "type": "TEXT"
    }
  ]
};


/**
 * Build rt_holidays table
 * @type {buildTable}
 * @private
 */
function buildTable(db, agencyOptions, callback) {
  build.init(db, TABLE, agencyOptions, function() {
    callback();
  });
}





module.exports = buildTable;