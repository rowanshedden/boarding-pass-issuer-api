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
  return db.createTable('issuance_requests', {
    request_id: {
      type: 'int',
      primaryKey: true,
      unique: true,
      autoIncrement: true,
    },
    contact_id: {type: 'text', null: true},
    invitation_id: {type: 'int', null: true},
    schema_id: 'text',
    attributes: 'json',
    status: 'text',
    created_at: 'timestamptz',
    updated_at: 'timestamptz',
  })
}

exports.down = function (db) {
  return db.dropTable('issuance_requests')
}

exports._meta = {
  version: 1,
}
