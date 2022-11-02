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
  return db
    .addColumn('presentation_reports', 'contact_label', {
      type: 'text',
      null: true,
    })
    .then(function () {
      return db.addColumn('presentation_reports', 'contact_id', {
        type: 'text',
        null: true,
      })
    })
}

exports.down = function (db) {
  return db.removeColumn('presentation_reports', 'contact_label').then(function () {
    return db.removeColumn('presentation_reports', 'contact_id')
  })
}

exports._meta = {
  version: 1.1,
}