const {Sequelize, DataTypes, Model} = require('sequelize')

const init = require('./init.js')
sequelize = init.connect()

const {Contact} = require('./contacts.js')
const {Connection} = require('./connections.js')

class Demographic extends Model {}

Demographic.init(
  {
    contact_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      //allowNull: false,
    },
    mpid: {
      type: DataTypes.TEXT,
    },
    first_name: {
      type: DataTypes.TEXT,
    },
    middle_name: {
      type: DataTypes.TEXT,
    },
    last_name: {
      type: DataTypes.TEXT,
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
    },
    gender: {
      type: DataTypes.TEXT,
    },
    phone: {
      type: DataTypes.TEXT,
    },
    address: {
      type: DataTypes.JSON,
    },
    created_at: {
      type: DataTypes.DATE,
    },
    updated_at: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize, // Pass the connection instance
    modelName: 'Demographic',
    tableName: 'demographic_data', // Our table names don't follow the sequelize convention and thus must be explicitly declared
    timestamps: false,
  },
)

Contact.hasOne(Demographic, {
  foreignKey: {
    name: 'contact_id',
  },
})
Demographic.belongsTo(Contact, {
  foreignKey: {
    name: 'contact_id',
  },
})

const createDemographic = async function (
  contact_id,
  mpid,
  first_name,
  middle_name,
  last_name,
  date_of_birth,
  gender,
  phone,
  address,
) {
  try {
    const timestamp = Date.now()

    const demographic = await Demographic.create({
      contact_id: contact_id,
      mpid: mpid,
      first_name: first_name,
      middle_name: middle_name,
      last_name: last_name,
      date_of_birth: date_of_birth,
      gender: gender,
      phone: phone,
      address: address,
      created_at: timestamp,
      updated_at: timestamp,
    })
    console.log(demographic instanceof Demographic) // true

    console.log('Demographic data saved successfully.')
    return demographic
  } catch (error) {
    console.error('Error saving demographic data to the database: ', error)
  }
}

const createOrUpdateDemographic = async function (
  contact_id,
  mpid,
  first_name,
  middle_name,
  last_name,
  date_of_birth,
  gender,
  phone,
  address,
) {
  try {
    await sequelize.transaction(
      {
        isolationLevel: Sequelize.Transaction.SERIALIZABLE,
      },
      async (t) => {
        let demographic = await Demographic.findOne({
          where: {
            contact_id: contact_id,
          },
        })

        const timestamp = Date.now()

        //(JamesKEbert)TODO: Change upsert for a better mechanism, such as locking potentially.
        if (!demographic) {
          console.log('Creating Demographic')
          const demographic = await Demographic.upsert({
            contact_id: contact_id,
            mpid: mpid,
            first_name: first_name,
            middle_name: middle_name,
            last_name: last_name,
            date_of_birth: date_of_birth,
            gender: gender,
            phone: phone,
            address: address,
            created_at: timestamp,
            updated_at: timestamp,
          })
        } else {
          console.log('Updating Demographic')
          await Demographic.update(
            {
              contact_id: contact_id,
              mpid: mpid,
              first_name: first_name,
              middle_name: middle_name,
              last_name: last_name,
              date_of_birth: date_of_birth,
              gender: gender,
              phone: phone,
              address: address,
              updated_at: timestamp,
            },
            {
              where: {
                contact_id: contact_id,
              },
            },
          )
        }
      },
    )

    console.log('demographic saved successfully.')
    return
  } catch (error) {
    console.error('Error saving demographic to the database: ', error)
  }
}

const readDemographics = async function () {
  try {
    const demographics = await Demographic.findAll({
      include: [
        {
          model: Contact,
          required: true,
        },
      ],
    })

    console.log('All demographics:', JSON.stringify(demographics, null, 2))
    return demographics
  } catch (error) {
    console.error('Could not find demographics in the database: ', error)
  }
}

const readDemographic = async function (contact_id) {
  try {
    const demographic = await Demographic.findAll({
      where: {
        contact_id: contact_id,
      },
      include: [
        {
          model: Contact,
          required: true,
        },
      ],
    })

    console.log(
      'Requested demographic:',
      JSON.stringify(demographic[0], null, 2),
    )
    return demographic[0]
  } catch (error) {
    console.error('Could not find demographic in the database: ', error)
  }
}

const updateDemographic = async function (
  contact_id,
  mpid,
  first_name,
  middle_name,
  last_name,
  date_of_birth,
  gender,
  phone,
  address,
) {
  try {
    const timestamp = Date.now()

    await Demographic.update(
      {
        contact_id: contact_id,
        mpid: mpid,
        first_name: first_name,
        middle_name: middle_name,
        last_name: last_name,
        date_of_birth: date_of_birth,
        gender: gender,
        phone: phone,
        address: address,
        updated_at: timestamp,
      },
      {
        where: {
          contact_id: contact_id,
        },
      },
    )

    console.log('Demographic updated successfully.')
  } catch (error) {
    console.error('Error updating the Demographic: ', error)
  }
}

const deleteDemographic = async function (contact_id) {
  try {
    await Demographic.destroy({
      where: {
        contact_id: contact_id,
      },
    })

    console.log('Successfully deleted demographic')
  } catch (error) {
    console.error('Error while deleting demographic: ', error)
  }
}

module.exports = {
  Demographic,
  createDemographic,
  createOrUpdateDemographic,
  readDemographic,
  readDemographics,
  updateDemographic,
  deleteDemographic,
}
