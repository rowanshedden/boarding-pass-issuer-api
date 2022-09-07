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
  return db.createTable('invitations', {
    invitation_id: {
      type: 'int',
      primaryKey: true,
      unique: true,
      autoIncrement: true,
    },
    oob_id: {type: 'text', null: true},
    contact_id: {type: 'text', null: true},
    connection_id: {type: 'text', null: true},
    my_did: 'text',
    alias: 'text',
    invitation_key: 'text',
    invitation_mode: 'text',
    invitation_url: 'text',
    invitation: 'json',
    public: 'boolean',
    accept: 'text',
    their_role: 'text',
    their_label: 'text',
    service_endpoint: 'text',
    domain: 'text',
    path: 'text',
    workflow_status: 'text',
    state: 'text',
    description: 'text',
    active_starting_at: 'timestamptz',
    active_ending_at: {type: 'timestamptz', null: true},
    uses_allowed: {type: 'int', null: true},
    uses_remaining: {type: 'int', null: true},
    created_at: 'timestamptz',
    updated_at: 'timestamptz',
  })
}

exports.down = function (db) {
  return db.dropTable('invitations')
}

exports._meta = {
  version: 1,
}
