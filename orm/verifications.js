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
    },
    // processor_id: {
    //   type: DataTypes.STRING,
    // },
    // merchant_id: {
    //   type: DataTypes.STRING,
    // },
    connection_id: {
      type: DataTypes.STRING,
    },
    contact_id: {
      type: DataTypes.STRING,
    },
    invitation_id: {
      type: DataTypes.STRING,
    },
    // connection_state: {
    //   type: DataTypes.STRING,
    // },
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
    // proof_state: {
    //   type: DataTypes.STRING,
    // },
    presentation_exchange_id: {
      type: DataTypes.STRING,
    },
    error: {
      type: DataTypes.STRING,
    },
    // result: {
    //   type: DataTypes.STRING,
    // },
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

const createVerificationRecord = async function (
  // processor_id
  // merchant_id
  connection_id,
  contact_id,
  invitation_id,
  // connection_state
  schema_id,
  schema_attributes,
  timeout,
  rules,
  meta_data,
  complete,
  results,
  result_string,
  result_data,
  // proof_state
  presentation_exchange_id,
  error,
  // result
  created_at,
  updated_at,
) {
  try {
    const verificationRecord = await Verification.upsert(
      {
        // processor_id: processor_id,
        // merchant_id: merchant_id,
        connection_id: connection_id,
        contact_id: contact_id,
        invitation_id: invitation_id,
        // connection_state: connection_state,
        schema_id: schema_id,
        schema_attributes: schema_attributes,
        timeout: timeout,
        rules: rules,
        meta_data: meta_data,
        complete: complete,
        results: results,
        result_string: result_string,
        result_data: result_data,
        // proof_state: proof_state,
        presentation_exchange_id: presentation_exchange_id,
        error: error,
        // result: result,
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

const readVerifications = async function (verification_id) {
  try {
    const verification = await Verification.findAll({
      where: {
        verification_id: verification_id,
      },
    })
    return verification[0]
  } catch (error) {
    console.error('Could not find verification record in the database: ', error)
  }
}

module.exports = {
  Verification,
  readVerifications,
  createVerificationRecord,
}
