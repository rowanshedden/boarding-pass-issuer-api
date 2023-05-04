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
    .addColumn('passports', 'passport_issuing_state', {
      type: 'string',
      null: true,
    })
    .then(function () {
      return db.addColumn('passports', 'passport_dtc', {
        type: 'string',
        null: true,
      })
    })
    .then(function () {
      return db.addColumn('passports', 'passport_upk', {
        type: 'string',
        null: true,
      })
    })
    .then(function () {
      return db.addColumn('passports', 'passport_created_date', {
        type: 'timestamptz',
        null: true,
      })
    })
    .then(function () {
      return db.renameColumn('passports', 'photo', 'passport_chip_photo')
    })
    .then(function () {
      return db.removeColumn('passports', 'passport_place_of_birth')
    })
    .then(function () {
      return db.removeColumn('passports', 'passport_type')
    })
    .then(function () {
      return db.removeColumn('passports', 'passport_code')
    })
}

exports.down = function (db) {
  return null
}

exports._meta = {
  version: 1,
}
