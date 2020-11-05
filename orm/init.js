const {Sequelize} = require('sequelize')

exports.connect = function () {
  const sequelize = new Sequelize('government', 'government', 'government', {
    host: 'government-db',
    dialect: 'postgres',
    logging: console.log, // The other option we may want is false (no logging of database queries)
    omitNull: true,
  })

  return sequelize
}
