'use strict';

const utils = require('../utils.js');


// TABLE STRUCTURE
const TABLE = {
  name: "gtfs_directions",
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


function run(db, gtfs_dir, callback) {
  utils.create(db, TABLE, function() {
    utils.add(db, TABLE, VALUES, callback);
  });
}



module.exports = run;