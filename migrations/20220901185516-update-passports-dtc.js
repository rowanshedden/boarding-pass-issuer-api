'use strict';

var dbm;
var type;
var seed;

// 0: {name: 'nationality', value: 'what nationality'}
// 1: {name: 'document-number', value: 'Passport number'}
// 2: {name: 'given-names', value: 'my given name'}
// 3: {name: 'issuing-state', value: 'issue state'}
// 4: {name: 'document-type', value: 'document'}
// 5: {name: 'dtc', value: 'some dtc stuff'}
// 6: {name: 'chip-photo', value: 'chip photo'}
// 7: {name: 'gender', value: 'gender'}
// 8: {name: 'issue-date', value: 'issue data'}
// 9: {name: 'issuing-authority', value: 'issued authority'}
// 10: {name: 'upk', value: 'some upk stuff'}
// 11: {name: 'created-date', value: 'schema creation date'}
// 12: {name: 'expiry-date', value: 'expried when'}
// 13: {name: 'date-of-birth', value: 'date of birth'}
// 14: {name: 'family-name', value: 'name of family'}

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db
  .addColumn('passports', 'dtc', {
    type: 'string',
    null: true,
  })
  .then(function () {
    return db.addColumn('travelers', 'chip-photo', {
      type: 'string',
      null: true,
    })
  })
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
