'use strict';

const build = require('../utils/build.js');


/**
 * gtfs_directions table definition
 * @type {RTTableSchema}
 * @private
 */
const TABLE = {
  sourceDirectory: "{{locations.gtfsDir}}",
  sourceFile: "gtfs_directions",
  fields: [
    {
      "name": "direction_id",
      "type": "INTEGER",
      "attributes": "PRIMARY KEY NOT NULL"
    },
    {
      "name": "description",
      "type": "TEXT"
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
    "direction_id": 0,
    "description": "This Way"
  },
  {
    "direction_id": 1,
    "description": "That Way"
  }
];


/**
 * Build gtfs_calendar_dates table
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