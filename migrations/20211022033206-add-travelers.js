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
  const sql = 'DELETE FROM demographic_data'
  db.runSql(sql, function (err) {
    if (err) return console.log(err)
  })

  return (
    db
      .renameTable('demographic_data', 'travelers')
      // (eldersonar) Renaming old columns
      .then(function () {
        return db.renameColumn('travelers', 'email', 'traveler_email')
      })
      .then(function () {
        return db.renameColumn('travelers', 'phone', 'traveler_phone')
      })
      // (eldersonar) Removing old columns
      .then(function () {
        return db.removeColumn('travelers', 'address')
      })
      // (eldersonar) Adding new columns
      .then(function () {
        return db.addColumn('travelers', 'traveler_country', {type: 'string'})
      })
      .then(function () {
        return db.addColumn('travelers', 'traveler_country_of_origin', {
          type: 'string',
          null: true,
        })
      })
      .then(function () {
        return db.addColumn('travelers', 'arrival_airline', {type: 'string'})
      })
      .then(function () {
        return db.addColumn('travelers', 'arrival_flight_number', {
          type: 'string',
        })
      })
      .then(function () {
        return db.addColumn('travelers', 'arrival_date', {type: 'timestamptz'})
      })
      .then(function () {
        return db.addColumn('travelers', 'arrival_destination_port_code', {
          type: 'string',
          null: true,
        })
      })
      .then(function () {
        return db.addColumn('travelers', 'arrival_destination_country_code', {
          type: 'string',
          null: true,
        })
      })
      .then(function () {
        return db.addColumn('travelers', 'departure_airline', {
          type: 'string',
          null: true,
        })
      })
      .then(function () {
        return db.addColumn('travelers', 'departure_flight_number', {
          type: 'string',
          null: true,
        })
      })
      .then(function () {
        return db.addColumn('travelers', 'departure_date', {
          type: 'timestamptz',
          null: true,
        })
      })
      .then(function () {
        return db.addColumn('travelers', 'departure_destination_port_code', {
          type: 'string',
          null: true,
        })
      })
      .then(function () {
        return db.addColumn('travelers', 'departure_destination_country_code', {
          type: 'string',
          null: true,
        })
      })
      .then(function () {
        return db.addColumn('travelers', 'verification_status', {
          type: 'boolean',
          null: true,
        })
      })
      .then(function () {
        return db.addColumn('travelers', 'proof_status', {
          type: 'string',
          null: true,
        })
      })
  )
}

exports.down = function (db) {
  return (
    db
      // (eldersonar) Name the table back
      .renameTable('travelers', 'demographic_data')
      // (eldersonar) Renaming old columns back
      .then(function () {
        return db.renameColumn('demographic_data', 'traveler_email', 'email')
      })
      .then(function () {
        return db.renameColumn('demographic_data', 'traveler_phone', 'phone')
      })
      // (eldersonar) Adding back old columns
      .then(function () {
        return db.addColumn('demographic_data', 'address', {type: 'json'})
      })
      // (eldersonar) Removing new columns
      .then(function () {
        return db.removeColumn('demographic_data', 'traveler_country')
      })
      .then(function () {
        return db.removeColumn('demographic_data', 'traveler_country_of_origin')
      })
      .then(function () {
        return db.removeColumn('demographic_data', 'arrival_airline')
      })
      .then(function () {
        return db.removeColumn('demographic_data', 'arrival_flight_number')
      })
      .then(function () {
        return db.removeColumn('demographic_data', 'arrival_date')
      })
      .then(function () {
        return db.removeColumn(
          'demographic_data',
          'arrival_destination_port_code',
        )
      })
      .then(function () {
        return db.removeColumn(
          'demographic_data',
          'arrival_destination_country_code',
        )
      })
      .then(function () {
        return db.removeColumn('demographic_data', 'departure_airline')
      })
      .then(function () {
        return db.removeColumn('demographic_data', 'departure_flight_number')
      })
      .then(function () {
        return db.removeColumn('demographic_data', 'departure_date')
      })
      .then(function () {
        return db.removeColumn(
          'demographic_data',
          'departure_destination_port_code',
        )
      })
      .then(function () {
        return db.removeColumn(
          'demographic_data',
          'departure_destination_country_code',
        )
      })
      .then(function () {
        return db.removeColumn('demographic_data', 'verification_status')
      })
      .then(function () {
        return db.removeColumn('demographic_data', 'proof_status')
      })
  )
}

exports._meta = {
  version: 1.1,
}
