const {Sequelize, DataTypes, Model} = require('sequelize')

const init = require('./init.js')
sequelize = init.connect()

class Verification extends Model {}
exports.Verification = Verification

Verification.init(
  {
    verification_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      unique: true,
    },
    connection_id: {
      type: DataTypes.STRING,
    },
    contact_id: {
      type: DataTypes.STRING,
    },
    invitation_id: {
      type: DataTypes.INTEGER,
    },
    schema_id: {
      type: DataTypes.STRING,
    },
    schema_attributes: {
      type: DataTypes.JSON,
    },
    timeout: {
      type: DataTypes.INTEGER,
    },
    rule: {
      type: DataTypes.STRING,
    },
    meta_data: {
      type: DataTypes.JSON,
    },
    complete: {
      type: DataTypes.BOOLEAN,
    },
    result: {
      type: DataTypes.BOOLEAN,
    },
    result_string: {
      type: DataTypes.STRING,
    },
    result_data: {
      type: DataTypes.JSON,
    },
    presentation_exchange_id: {
      type: DataTypes.STRING,
    },
    error: {
      type: DataTypes.STRING,
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
    modelName: 'Verification',
    tableName: 'verifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
)

const createVerificationRecord = async function (data, created_at, updated_at) {
  try {
    const verificationRecord = await Verification.upsert(
      {
        connection_id: data.connection_id,
        contact_id: data.contact_id,
        invitation_id: data.invitation_id,
        schema_id: data.schema_id,
        schema_attributes: data.schema_attributes,
        timeout: data.timeout,
        rule: data.rule,
        meta_data: data.meta_data,
        complete: data.complete,
        result: data.result,
        result_string: data.result_string,
        result_data: data.result_data,
        error: data.error,
        created_at: created_at,
        updated_at: updated_at,
      },
      {
        returning: true,
      },
    )

    console.log('Verification saved successfully.')
    return verificationRecord
  } catch (error) {
    console.error('Error saving verification record to the database: ', error)
  }
}

const createOrUpdateVerificationRecord = async function (
  data,
  created_at,
  updated_at,
) {
  let verificationRecord
  try {
    await sequelize.transaction(
      {
        isolationLevel: Sequelize.Transaction.SERIALIZABLE,
      },
      async (t) => {
        let verification = await Verification.findOne({
          where: {
            invitation_id: data.invitation_id,
          },
        })
        const timestamp = Date.now()

        if (!verification) {
          console.log('Creating Verification Record')
          verificationRecord = await Verification.create({
            connection_id: data.connection_id,
            contact_id: data.contact_id,
            invitation_id: data.invitation_id,
            schema_id: data.schema_id,
            schema_attributes: data.schema_attributes,
            timeout: data.timeout,
            rule: data.rule,
            meta_data: data.meta_data,
            complete: data.complete,
            result: data.result,
            result_string: data.result_string,
            result_data: data.result_data,
            error: data.error,
            created_at: created_at,
            updated_at: updated_at,
          })
        } else {
          console.log('Updating Verification Record')
          verificationRecord = await Verification.update(
            {
              connection_id: data.connection_id,
              contact_id: data.contact_id,
              invitation_id: data.invitation_id,
              schema_id: data.schema_id,
              schema_attributes: data.schema_attributes,
              timeout: data.timeout,
              rule: data.rule,
              meta_data: data.meta_data,
              complete: data.complete,
              result: data.result,
              result_string: data.result_string,
              result_data: data.result_data,
              error: data.error,
              created_at: created_at,
              updated_at: updated_at,
            },
            {
              where: {
                invitation_id: data.invitation_id,
              },
            },
          )
        }
      },
    )
    console.log('Verification saved successfully')
    return verificationRecord
  } catch (error) {
    console.error('Error saving Verification to database: ', error)
  }
}

const readVerificationsByVerificationId = async function (verification_id) {
  try {
    const verification = await Verification.findAll({
      where: {
        verification_id,
      },
    })
    return verification[0]
  } catch (error) {
    console.error('Could not find verification record in the database: ', error)
  }
}

const readVerificationsByInvitationId = async function (invitation_id) {
  try {
    const verification = await Verification.findAll({
      where: {
        invitation_id,
      },
    })
    return verification
  } catch (error) {
    console.error('Could not find verification record in the database: ', error)
  }
}

const readVerificationsByContactId = async function (verification_id) {
  try {
    const verification = await Verification.findAll({
      where: {
        verification_id,
      },
    })
    return verification[0]
  } catch (error) {
    console.error('Could not find verification record in the database: ', error)
  }
}

const readVerificationsByInvitationAndPresExchangeId = async function (
  invitation_id,
  presentation_exchange_id,
) {
  try {
    const verification = await Verification.findAll({
      where: {
        invitation_id,
        presentation_exchange_id,
      },
    })
    return verification[0]
  } catch (error) {
    console.error('Could not find verification record in the database: ', error)
  }
}

module.exports = {
  Verification,
  readVerificationsByVerificationId,
  readVerificationsByInvitationId,
  readVerificationsByContactId,
  readVerificationsByInvitationAndPresExchangeId,
  createVerificationRecord,
  createOrUpdateVerificationRecord,
}
