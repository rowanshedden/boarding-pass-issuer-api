'use strict'

var dbm
var type
var seed

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate
  type = dbm.dataType
  seed = seedLink
}

exports.up = function (db) {
  // If there are demographics, we need to delete them anyway

  return db
    .addColumn('travelers', 'proof_type', {
      type: 'string',
      null: true,
    })
    .then(function () {
      return db.addColumn('travelers', 'proof_result_list', {
        type: 'json',
        null: true,
      })
    })
}

exports.down = function (db) {
  return db.removeColumn('travelers', 'proof_type').then(function () {
    return db.removeColumn('travelers', 'proof_result_list')
  })
}

exports._meta = {
  version: 1.1,
}
