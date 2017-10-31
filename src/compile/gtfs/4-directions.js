'use strict';

const build = require('../utils/build.js');


// TABLE STRUCTURE
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

// INITIAL DATA VALUES FOR TABLE
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


function buildTable(db, agency, callback) {
  build.create(db, TABLE, function() {
    build.add(db, TABLE, VALUES, callback);
  });
}



module.exports = buildTable;