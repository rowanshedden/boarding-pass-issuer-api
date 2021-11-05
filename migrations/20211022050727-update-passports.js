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
  // (eldersonar) Renaming old columns
  return (
    db
      .renameColumn('passports', 'surname', 'passport_surnames')
      .then(function () {
        return db.renameColumn(
          'passports',
          'given_names',
          'passport_given_names',
        )
      })
      .then(function () {
        return db.renameColumn('passports', 'sex', 'passport_gender_legal')
      })
      .then(function () {
        return db.renameColumn(
          'passports',
          'place_of_birth',
          'passport_place_of_birth',
        )
      })
      .then(function () {
        return db.renameColumn(
          'passports',
          'nationality',
          'passport_nationality',
        )
      })
      .then(function () {
        return db.renameColumn('passports', 'type', 'passport_type')
      })
      .then(function () {
        return db.renameColumn('passports', 'code', 'passport_code')
      })
      .then(function () {
        return db.renameColumn('passports', 'authority', 'passport_authority')
      })
      // (eldersonar) Removing old columns
      .then(function () {
        return db.removeColumn('passports', 'date_of_birth')
      })
      .then(function () {
        return db.removeColumn('passports', 'date_of_issue')
      })
      .then(function () {
        return db.removeColumn('passports', 'date_of_expiration')
      })
      // (eldersonar) Adding new columns
      .then(function () {
        return db.addColumn('passports', 'passport_date_of_birth', {
          type: 'timestamptz',
        })
      })
      .then(function () {
        return db.addColumn('passports', 'passport_date_of_issue', {
          type: 'timestamptz',
        })
      })
      .then(function () {
        return db.addColumn('passports', 'passport_date_of_expiration', {
          type: 'timestamptz',
        })
      })
  )
}

exports.down = function (db) {
  return db.dropTable('passports')
}

exports._meta = {
  version: 1,
}
