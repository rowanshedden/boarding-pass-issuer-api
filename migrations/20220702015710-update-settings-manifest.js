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
  return db.insert(
    'settings',
    ['key', 'value'],
    [
      'manifest',
      JSON.stringify({
        short_name: 'Boarding Pass Issuer',
        name: 'Boarding Pass Issuer Enterprise Agent',
        icons: [
          {
            src: 'favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon',
          },
          {
            src: 'icon192.png',
            type: 'image/png',
            sizes: '192x192',
          },
          {
            src: 'icon512.png',
            type: 'image/png',
            sizes: '512x512',
          },
        ],
        start_url: '.',
        display: 'standalone',
        theme_color: '#555555',
        background_color: '#ffffff',
      }),
    ],
  )
}

exports.down = function (db) {
  return db.runSql(`DELETE settings WHERE key = 'manifest';`, function (err) {
    if (err) return console.log(err)
  })
}

exports._meta = {
  version: 1,
}
