const {Sequelize, DataTypes, Model} = require('sequelize')

const init = require('./init.js')
sequelize = init.connect()

class Credential extends Model {}

Credential.init(
  {
    credential_exchange_id: {
      type: DataTypes.TEXT,
      unique: true,
      primaryKey: true,
      allowNull: false,
    },
    credential_id: {
      type: DataTypes.TEXT,
    },
    credential: {
      type: DataTypes.JSON,
    },
    raw_credential: {
      type: DataTypes.JSON,
    },
    revocation_id: {
      type: DataTypes.TEXT,
    },

    connection_id: {
      type: DataTypes.TEXT,
    },
    state: {
      type: DataTypes.TEXT,
    },
    role: {
      type: DataTypes.TEXT,
    },
    initiator: {
      type: DataTypes.TEXT,
    },

    thread_id: {
      type: DataTypes.TEXT,
    },
    parent_thread_id: {
      type: DataTypes.TEXT,
    },

    schema_id: {
      type: DataTypes.TEXT,
    },
    credential_definition_id: {
      type: DataTypes.TEXT,
    },
    revoc_reg_id: {
      type: DataTypes.TEXT,
    },

    credential_proposal_dict: {
      type: DataTypes.JSON,
    },
    credential_offer: {
      type: DataTypes.JSON,
    },
    credential_offer_dict: {
      type: DataTypes.JSON,
    },
    credential_request: {
      type: DataTypes.JSON,
    },
    credential_request_metadata: {
      type: DataTypes.JSON,
    },

    auto_issue: {
      type: DataTypes.BOOLEAN,
    },
    auto_offer: {
      type: DataTypes.BOOLEAN,
    },
    auto_remove: {
      type: DataTypes.BOOLEAN,
    },

    error_msg: {
      type: DataTypes.TEXT,
    },
    trace: {
      type: DataTypes.BOOLEAN,
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
    modelName: 'Credential',
    tableName: 'issue_credentials', // Our table names don't follow the sequelize convention and thus must be explicitly declared
    timestamps: false,
  },
)

const createCredential = async function (
  credential_exchange_id,
  credential_id,
  credential,
  raw_credential,
  revocation_id,

  connection_id,
  state,
  role,
  initiator,

  thread_id,
  parent_thread_id,

  schema_id,
  credential_definition_id,
  revoc_reg_id,

  credential_proposal_dict,
  credential_offer,
  credential_offer_dict,
  credential_request,
  credential_request_metadata,

  auto_issue,
  auto_offer,
  auto_remove,

  error_msg,
  trace,
) {
  try {
    const timestamp = Date.now()

    const credentialRecord = await Credential.upsert({
      credential_exchange_id: credential_exchange_id,
      credential_id: credential_id,
      credential: credential,
      raw_credential: raw_credential,
      revocation_id: revocation_id,

      connection_id: connection_id,
      state: state,
      role: role,
      initiator: initiator,

      thread_id: thread_id,
      parent_thread_id: parent_thread_id,

      schema_id: schema_id,
      credential_definition_id: credential_definition_id,
      revoc_reg_id: revoc_reg_id,

      credential_proposal_dict: credential_proposal_dict,
      credential_offer: credential_offer,
      credential_offer_dict: credential_offer_dict,
      credential_request: credential_request,
      credential_request_metadata: credential_request_metadata,

      auto_issue: auto_issue,
      auto_offer: auto_offer,
      auto_remove: auto_remove,

      error_msg: error_msg,
      trace: trace,

      created_at: timestamp,
      updated_at: timestamp,
    })

    console.log('Credential saved successfully.')
    return credentialRecord[0]
  } catch (error) {
    console.error('Error saving credential to the database: ', error)
  }
}

const readCredential = async function (credential_exchange_id) {
  try {
    const credential = await Credential.findAll({
      where: {
        credential_exchange_id: credential_exchange_id,
        // credential
      },
    })

    return credential[0]
  } catch (error) {
    console.error('Could not find credential in the database: ', error)
  }
}

const readCredentials = async function () {
  try {
    const credentials = await Credential.findAll()
    return credentials
  } catch (error) {
    console.error('Could not find credentials in the database: ', error)
  }
}

const updateCredential = async function (
  credential_exchange_id,
  credential_id,
  credential,
  raw_credential,
  revocation_id,

  connection_id,
  state,
  role,
  initiator,

  thread_id,
  parent_thread_id,

  schema_id,
  credential_definition_id,
  revoc_reg_id,

  credential_proposal_dict,
  credential_offer,
  credential_offer_dict,
  credential_request,
  credential_request_metadata,

  auto_issue,
  auto_offer,
  auto_remove,

  error_msg,
  trace,
) {
  try {
    const timestamp = Date.now()

    const credentialRecord = await Credential.update(
      {
        credential_exchange_id: credential_exchange_id,
        credential_id: credential_id,
        credential: credential,
        raw_credential: raw_credential,
        revocation_id: revocation_id,

        connection_id: connection_id,
        state: state,
        role: role,
        initiator: initiator,

        thread_id: thread_id,
        parent_thread_id: parent_thread_id,

        schema_id: schema_id,
        credential_definition_id: credential_definition_id,
        revoc_reg_id: revoc_reg_id,

        credential_proposal_dict: credential_proposal_dict,
        credential_offer: credential_offer,
        credential_offer_dict: credential_offer_dict,
        credential_request: credential_request,
        credential_request_metadata: credential_request_metadata,

        auto_issue: auto_issue,
        auto_offer: auto_offer,
        auto_remove: auto_remove,

        error_msg: error_msg,
        trace: trace,

        updated_at: timestamp,
      },
      {
        where: {
          credential_exchange_id: credential_exchange_id,
        },
        returning: true,
      },
    )
    // Select results [1], select the first result [0]
    console.log('Credential updated successfully.')
    return credentialRecord[1][0]
  } catch (error) {
    console.error('Error updating the Credential: ', error)
  }
}

const deleteCredential = async function (credential_id) {
  try {
    await Credential.destroy({
      where: {
        credential_id: credential_id,
      },
    })

    console.log('Successfully deleted credential')
  } catch (error) {
    console.error('Error while deleting credential: ', error)
  }
}

module.exports = {
  createCredential,
  readCredential,
  readCredentials,
  updateCredential,
  deleteCredential,
}
