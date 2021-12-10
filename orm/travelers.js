const {Sequelize, DataTypes, Model} = require('sequelize')
const init = require('./init.js')
sequelize = init.connect()
const {Contact} = require('./contacts.js')

class Traveler extends Model {}

Traveler.init(
  {
    contact_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      // allowNull: false,
    },
    traveler_email: {
      type: DataTypes.TEXT,
    },
    traveler_phone: {
      type: DataTypes.TEXT,
    },
    traveler_country: {
      type: DataTypes.TEXT,
    },
    traveler_country_of_origin: {
      type: DataTypes.TEXT,
    },
    arrival_airline: {
      type: DataTypes.TEXT,
    },
    arrival_flight_number: {
      type: DataTypes.TEXT,
    },
    arrival_date: {
      type: DataTypes.DATE,
    },
    arrival_destination_port_code: {
      type: DataTypes.TEXT,
    },
    arrival_destination_country_code: {
      type: DataTypes.TEXT,
    },
    departure_airline: {
      type: DataTypes.TEXT,
    },
    departure_flight_number: {
      type: DataTypes.TEXT,
    },
    departure_date: {
      type: DataTypes.DATE,
    },
    departure_destination_port_code: {
      type: DataTypes.TEXT,
    },
    departure_destination_country_code: {
      type: DataTypes.TEXT,
    },
    verification_status: {
      type: DataTypes.BOOLEAN,
    },
    proof_status: {
      type: DataTypes.TEXT,
    },
    proof_type: {
      type: DataTypes.TEXT,
    },
    proof_result_list: {
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
    modelName: 'Traveler',
    tableName: 'travelers', // Our table names don't follow the sequelize convention and thus must be explicitly declared
    timestamps: false,
  },
)

Contact.hasOne(Traveler, {
  foreignKey: {
    name: 'contact_id',
  },
})
Traveler.belongsTo(Contact, {
  foreignKey: {
    name: 'contact_id',
  },
})

const createTraveler = async function (
  contact_id,
  traveler_email,
  traveler_phone,
  traveler_country,
  traveler_country_of_origin,
  arrival_airline,
  arrival_flight_number,
  arrival_date,
  arrival_destination_port_code,
  arrival_destination_country_code,
  departure_airline,
  departure_flight_number,
  departure_date,
  departure_destination_port_code,
  departure_destination_country_code,
) {
  try {
    const timestamp = Date.now()

    const traveler = await Traveler.create({
      contact_id,
      traveler_email,
      traveler_phone,
      traveler_country,
      traveler_country_of_origin,
      arrival_airline,
      arrival_flight_number,
      arrival_date,
      arrival_destination_port_code,
      arrival_destination_country_code,
      departure_airline,
      departure_flight_number,
      departure_date,
      departure_destination_port_code,
      departure_destination_country_code,
      created_at: timestamp,
      updated_at: timestamp,
    })

    console.log('Traveler data saved successfully.')
    return traveler
  } catch (error) {
    console.error('Error saving traveler data to the database: ', error)
  }
}

const createOrUpdateTraveler = async function (
  contact_id,
  traveler_email,
  traveler_phone,
  traveler_country,
  traveler_country_of_origin,
  arrival_airline,
  arrival_flight_number,
  arrival_date,
  arrival_destination_port_code,
  arrival_destination_country_code,
  departure_airline,
  departure_flight_number,
  departure_date,
  departure_destination_port_code,
  departure_destination_country_code,
) {
  try {
    await sequelize.transaction(
      {
        isolationLevel: Sequelize.Transaction.SERIALIZABLE,
      },
      async (t) => {
        let traveler = await Traveler.findOne({
          where: {
            contact_id,
          },
        })

        const timestamp = Date.now()

        // (JamesKEbert) TODO: Change upsert for a better mechanism, such as locking potentially.
        if (!traveler) {
          console.log('Creating Traveler')
          const traveler = await Traveler.upsert({
            contact_id,
            traveler_email,
            traveler_phone,
            traveler_country,
            traveler_country_of_origin,
            arrival_airline,
            arrival_flight_number,
            arrival_date,
            arrival_destination_port_code,
            arrival_destination_country_code,
            departure_airline,
            departure_flight_number,
            departure_date,
            departure_destination_port_code,
            departure_destination_country_code,
            created_at: timestamp,
            updated_at: timestamp,
          })
        } else {
          console.log('Updating Traveler')
          await Traveler.update(
            {
              contact_id,
              traveler_email,
              traveler_phone,
              traveler_country,
              traveler_country_of_origin,
              arrival_airline,
              arrival_flight_number,
              arrival_date,
              arrival_destination_port_code,
              arrival_destination_country_code,
              departure_airline,
              departure_flight_number,
              departure_date,
              departure_destination_port_code,
              departure_destination_country_code,
              updated_at: timestamp,
            },
            {
              where: {
                contact_id,
              },
            },
          )
        }
      },
    )

    console.log('Traveler saved successfully.')
    return true
  } catch (error) {
    console.error('Error saving traveler to the database: ', error)
  }
}

const readTravelers = async function () {
  try {
    const travelers = await Traveler.findAll({
      include: [
        {
          model: Contact,
          required: true,
        },
      ],
    })

    return travelers
  } catch (error) {
    console.error('Could not find travelers in the database: ', error)
  }
}

const readTraveler = async function (contact_id) {
  try {
    const travelers = await Traveler.findAll({
      where: {
        contact_id,
      },
      include: [
        {
          model: Contact,
          required: true,
        },
      ],
    })

    return traveler[0]
  } catch (error) {
    console.error('Could not find traveler in the database: ', error)
  }
}

const updateTravelerVerification = async function (
  contact_id,
  verification_status,
) {
  try {
    const timestamp = Date.now()

    await Traveler.update(
      {
        verification_status,
        updated_at: timestamp,
      },
      {
        where: {
          contact_id,
        },
      },
    )

    console.log('Verification status updated successfully.')
  } catch (error) {
    console.error('Error updating verification status: ', error)
  }
}

const updateProofStatus = async function (contact_id, proof_status) {
  try {
    const timestamp = Date.now()

    await Traveler.update(
      {
        proof_status,
        updated_at: timestamp,
      },
      {
        where: {
          contact_id,
        },
      },
    )

    console.log('Verification status updated successfully.')
  } catch (error) {
    console.error('Error updating verification status: ', error)
  }
}

const updateProofType = async function (contact_id, proof_type) {
  try {
    const timestamp = Date.now()

    await Traveler.update(
      {
        proof_type,
        updated_at: timestamp,
      },
      {
        where: {
          contact_id,
        },
      },
    )

    console.log('Answer to question updated successfully.')
  } catch (error) {
    console.error('Error updating answer to question : ', error)
  }
}

const updateProofResultList = async function (contact_id, proof_result_list) {
  try {
    const timestamp = Date.now()

    await Traveler.update(
      {
        proof_result_list,
        updated_at: timestamp,
      },
      {
        where: {
          contact_id,
        },
      },
    )

    console.log('Answer to question updated successfully.')
  } catch (error) {
    console.error('Error updating answer to question : ', error)
  }
}

const deleteTraveler = async function (contact_id) {
  try {
    await Traveler.destroy({
      where: {
        contact_id,
      },
    })

    console.log('Successfully deleted traveler')
  } catch (error) {
    console.error('Error while deleting traveler: ', error)
  }
}

module.exports = {
  Traveler,
  createTraveler,
  createOrUpdateTraveler,
  readTraveler,
  readTravelers,
  updateTravelerVerification,
  updateProofStatus,
  updateProofType,
  updateProofResultList,
  deleteTraveler,
}
