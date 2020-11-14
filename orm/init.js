const {Sequelize} = require('sequelize')

exports.connect = function () {
  const sequelize = new Sequelize('government', 'government', 'government', {
    host: 'government-db',
    dialect: 'postgres',
    logging: false, //console.log, // log to console or false (no logging of database queries)
    omitNull: true,
  })

  return sequelize
}
