'use strict'

const {text} = require('body-parser')

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
  return db.createTable('verifications', {
    verification_id: {type: 'int', primaryKey: true, autoIncrement: true},
    invitation_id: 'text',
    connection_id: 'text',
    contact_id: 'text',
    schema_id: 'text',
    schema_attributes: 'json',
    rule: 'text',
    meta_data: 'json',
    timeout: 'int',
    complete: 'boolean',
    result: 'boolean',
    result_string: 'text',
    result_data: 'json',
    presentation_exchange_id: 'text',
    error: 'text',
    created_at: 'timestamptz',
    updated_at: 'timestamptz',
  })
}

exports.down = function (db) {
  return db.dropTable('verifications')
}

exports._meta = {
  version: 1,
}
