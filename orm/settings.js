const {Sequelize, DataTypes, Model} = require('sequelize')

const init = require('./init.js')
sequelize = init.connect()

class Setting extends Model {}

Setting.init(
  {
    key: {
      type: DataTypes.TEXT,
      unique: true,
      primaryKey: true,
      allowNull: false,
    },
    value: {
      type: DataTypes.JSON,
      defaultValue: {},
      allowNull: false,
    },
  },
  {
    sequelize, // Pass the connection instance
    modelName: 'Setting',
    tableName: 'settings', // Our table names don't follow the sequelize convention and thus must be explicitly declared
    timestamps: false,
  },
)

exports.createSetting = async function (key, value) {
  try {
    const setting = await Setting.create({
      key: key,
      value: value,
    })
    // console.log(setting instanceof Setting) // true

    console.log('Setting saved successfully.')
    return setting
  } catch (error) {
    console.error('Error saving setting to the database: ', error)
  }
}

exports.readSettings = async function () {
  try {
    const settings = await Setting.findAll()
    // console.log(settings.every(setting => setting instanceof Setting)) // true

    console.log('All settings:', JSON.stringify(settings, null, 2))
    return settings
  } catch (error) {
    console.error('Could not find setting in the database: ', error)
  }
}

exports.readSetting = async function (key) {
  try {
    const setting = await Setting.findAll({
      where: {
        key: key,
      },
    })
    // console.log(setting[0] instanceof Setting) // true

    // console.log('Requested setting:', JSON.stringify(setting, null, 2))
    return setting[0]
  } catch (error) {
    console.error('Could not find setting in the database: ', error)
  }
}

exports.updateSettingKey = async function (key, new_key) {
  try {
    await Setting.update(
      {key: new_key},
      {
        where: {
          key: key,
        },
      },
    )

    console.log('Setting key updated successfully.')
  } catch (error) {
    console.error('Error updating the setting key: ', error)
  }
}

exports.updateSetting = async function (key, value) {
  try {
    await Setting.update(
      {key: key, value: value},
      {
        where: {
          key: key,
        },
      },
    )

    console.log('Setting updated successfully.')
  } catch (error) {
    console.error('Error updating the setting: ', error)
  }
}

exports.deleteSetting = async function (key) {
  try {
    await Setting.destroy({
      where: {
        key: key,
      },
    })

    console.log('Successfully deleted setting')
  } catch (error) {
    console.error('Error while deleting setting: ', error)
  }
}
