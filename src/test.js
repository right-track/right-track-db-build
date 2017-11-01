'use strict';

const options = require('./helpers/options.js');

console.log(options.get());
console.log(options.get().force);
options.set().force = true;
console.log(options.get().force);
console.log(options.get());

const sqlite3 = require('sqlite3');
let db = new sqlite3.Database("/Users/david/Desktop/database.db", function() {
  console.log(db);
});