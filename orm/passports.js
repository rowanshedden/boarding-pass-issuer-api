const {Sequelize, DataTypes, Model} = require('sequelize')

const init = require('./init.js')
sequelize = init.connect()

const {Contact} = require('./contacts.js')

class Passport extends Model {}

Passport.init(
  {
    contact_id: {
      type: DataTypes.TEXT,
      primaryKey: true,
    },
    passport_number: {
      type: DataTypes.TEXT,
    },
    passport_surnames: {
      type: DataTypes.TEXT,
    },
    passport_given_names: {
      type: DataTypes.TEXT,
    },
    passport_gender_legal: {
      type: DataTypes.TEXT,
    },
    passport_date_of_birth: {
      type: DataTypes.DATE,
    },
    passport_nationality: {
      type: DataTypes.TEXT,
    },
    passport_date_of_issue: {
      type: DataTypes.DATE,
    },
    passport_date_of_expiration: {
      type: DataTypes.DATE,
    },
    passport_authority: {
      type: DataTypes.TEXT,
    },
    // passport_chip_photo: {
    //   type: DataTypes.BLOB,
    // },
    passport_issuing_state: {
      type: DataTypes.TEXT,
    },
    passport_dtc: {
      type: DataTypes.TEXT,
    },
    passport_upk: {
      type: DataTypes.TEXT,
    },
    passport_created_date: {
      type: DataTypes.DATE,
    },
    created_at: {
      type: DataTypes.DATE,
    },
    updated_at: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    modelName: 'Passport',
    tableName: 'passports',
    timestamps: false,
  },
)

Contact.hasOne(Passport, {
  foreignKey: {
    name: 'contact_id',
  },
})
Passport.belongsTo(Contact, {
  foreignKey: {
    name: 'contact_id',
  },
})

const createPassport = async function (
  contact_id,
  passport_number,
  passport_surnames,
  passport_given_names,
  passport_gender_legal,
  passport_date_of_birth,
  passport_nationality,
  passport_date_of_issue,
  passport_date_of_expiration,
  passport_authority,
  passport_issuing_state,
  passport_dtc,
  passport_upk,
  passport_created_date,
  // passport_chip_photo,
) {
  try {
    const timestamp = Date.now()

    const passport = await Passport.create({
      contact_id: contact_id,
      passport_number: passport_number,
      passport_surnames: passport_surnames,
      passport_given_names: passport_given_names,
      passport_gender_legal: passport_gender_legal,
      passport_date_of_birth: passport_date_of_birth,
      passport_nationality: passport_nationality,
      passport_date_of_issue: passport_date_of_issue,
      passport_date_of_expiration: passport_date_of_expiration,
      passport_authority: passport_authority,
      passport_issuing_state,
      passport_dtc,
      passport_upk,
      passport_created_date,
      // passport_chip_photo,
      created_at: timestamp,
      updated_at: timestamp,
    })
    console.log('Passport data saved successfully.')
    return passport
  } catch (error) {
    console.error('Error saving passport data to database: ', error)
  }
}
const createOrUpdatePassport = async function (
  contact_id,
  passport_number,
  passport_surnames,
  passport_given_names,
  passport_gender_legal,
  passport_date_of_birth,
  passport_nationality,
  passport_date_of_issue,
  passport_date_of_expiration,
  passport_authority,
  passport_issuing_state,
  passport_dtc,
  passport_upk,
  passport_created_date,
  // passport_chip_photo,
) {
  try {
    await sequelize.transaction(
      {
        isolationLevel: Sequelize.Transaction.SERIALIZABLE,
      },
      async (t) => {
        let passport = await Passport.findOne({
          where: {
            contact_id: contact_id,
          },
        })
        const timestamp = Date.now()

        if (!passport) {
          console.log('Creating Passport')
          const passport = await Passport.upsert({
            contact_id: contact_id,
            passport_number: passport_number,
            passport_surnames: passport_surnames,
            passport_given_names: passport_given_names,
            passport_gender_legal: passport_gender_legal,
            passport_date_of_birth: passport_date_of_birth,
            passport_nationality: passport_nationality,
            passport_date_of_issue: passport_date_of_issue,
            passport_date_of_expiration: passport_date_of_expiration,
            passport_authority: passport_authority,
            passport_issuing_state,
            passport_dtc,
            passport_upk,
            passport_created_date,
            // passport_chip_photo,
            created_at: timestamp,
            updated_at: timestamp,
          })
        } else {
          console.log('Updating Passport')
          await Passport.update(
            {
              contact_id: contact_id,
              passport_number: passport_number,
              passport_surnames: passport_surnames,
              passport_given_names: passport_given_names,
              passport_gender_legal: passport_gender_legal,
              passport_date_of_birth: passport_date_of_birth,
              passport_nationality: passport_nationality,
              passport_date_of_issue: passport_date_of_issue,
              passport_date_of_expiration: passport_date_of_expiration,
              passport_authority: passport_authority,
              passport_issuing_state,
              passport_dtc,
              passport_upk,
              passport_created_date,
              // passport_chip_photo,
              created_at: timestamp,
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
    console.log('Passport saved successfully')
    return true
  } catch (error) {
    console.error('Error saving passport to database: ', error)
  }
}

const readPassports = async function () {
  try {
    const passports = await Passport.findAll({
      include: [
        {
          model: Contact,
          require: true,
        },
      ],
    })
    return passports
  } catch (error) {
    console.error('Could not find passports in the database: ', error)
  }
}

const readPassport = async function (contact_id) {
  try {
    const passport = await Passport.findAll({
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
    return passport[0]
  } catch (error) {
    console.error('Could not find passport in database: ', error)
  }
}

const updatePassport = async function (
  contact_id,
  passport_number,
  passport_surnames,
  passport_given_names,
  passport_gender_legal,
  passport_date_of_birth,
  passport_nationality,
  passport_date_of_issue,
  passport_date_of_expiration,
  passport_authority,
  passport_issuing_state,
  passport_dtc,
  passport_upk,
  passport_created_date,
  // passport_chip_photo,
) {
  try {
    const timestamp = Date.now()

    await Passport.update(
      {
        contact_id: contact_id,
        passport_number: passport_number,
        passport_surnames: passport_surnames,
        passport_given_names: passport_given_names,
        passport_gender_legal: passport_gender_legal,
        passport_date_of_birth: passport_date_of_birth,
        passport_nationality: passport_nationality,
        passport_date_of_issue: passport_date_of_issue,
        passport_date_of_expiration: passport_date_of_expiration,
        passport_authority: passport_authority,
        passport_issuing_state,
        passport_dtc,
        passport_upk,
        passport_created_date,
        // passport_chip_photo,
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        where: {
          contact_id: contact_id,
        },
      },
    )
    console.log('Passport updated successfully.')
  } catch (error) {
    console.error('Error updating the Passport: ', error)
  }
}

const deletePassport = async function (contact_id) {
  try {
    await Passport.destroy({
      where: {
        contact_id: contact_id,
      },
    })
    console.log('Successfully deleted passport')
  } catch (error) {
    console.error('Error while deleting passport: ', error)
  }
}

module.exports = {
  Passport,
  createPassport,
  createOrUpdatePassport,
  readPassports,
  readPassport,
  updatePassport,
  deletePassport,
}
