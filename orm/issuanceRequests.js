const {Sequelize, DataTypes, Model, Op} = require('sequelize')

const init = require('./init.js')
sequelize = init.connect()

class IssuanceRequest extends Model {}
exports.IssuanceRequest = IssuanceRequest

IssuanceRequest.init(
  {
    request_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    contact_id: {
      type: DataTypes.TEXT,
    },
    invitation_id: {
      type: DataTypes.TEXT,
    },
    schema_id: {
      type: DataTypes.TEXT,
    },
    attributes: {
      type: DataTypes.JSON,
    },
    status: {
      type: DataTypes.TEXT,
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
    modelName: 'IssuanceRequest',
    tableName: 'issuance_requests', // Our table names don't follow the sequelize convention and thus must be explicitly declared
    timestamps: false,
  },
)

const addRequest = async function (
  contact_id,
  invitation_id,
  schema_id,
  attributes,
) {
  try {
    const timestamp = Date.now()

    const issuanceRequest = await IssuanceRequest.create({
      contact_id: contact_id ? contact_id : null,
      invitation_id: invitation_id ? invitation_id : null,
      schema_id,
      attributes,
      status: 'new',
      created_at: timestamp,
      updated_at: timestamp,
    })
    return issuanceRequest
  } catch (error) {
    console.error('Error saving issuance request to the database: ', error)
  }
}

const readRequestsByContactId = async function (contact_id, status = null) {
  try {
    const issuanceRequests = await IssuanceRequest.findAll({
      where: {
        contact_id,
        status,
      },
    })
    console.log(
      'Retrieved issuance requests:',
      JSON.stringify(issuanceRequests, null, 2),
    )
    return issuanceRequests
  } catch (error) {
    console.error(
      'Could not find issuance request by contact_id in the database: ',
      error,
    )
  }
}

const readRequestsByInvitationId = async function (
  invitation_id,
  status = null,
) {
  try {
    const issuanceRequests = await IssuanceRequest.findAll({
      where: {
        invitation_id,
        status,
      },
    })
    console.log(
      'Retrieved issuance requests:',
      JSON.stringify(issuanceRequests, null, 2),
    )
    return issuanceRequests
  } catch (error) {
    console.error(
      'Could not find issuance request by invitation_id in the database: ',
      error,
    )
  }
}

const readRequestsByIdentifiers = async function (
  contact_id,
  invitation_id,
  status,
) {
  try {
    const issuanceRequests = await IssuanceRequest.findAll({
      where: {
        [Op.or]: [
          {
            contact_id,
            invitation_id: {
              [Op.eq]: null,
            },
            status,
          },
          {
            contact_id: {
              [Op.eq]: null,
            },
            invitation_id,
            status,
          },
          {
            contact_id,
            invitation_id,
            status,
          },
        ],
      },
    })
    console.log(
      'Retrieved issuance requests by any combinations of identifiers:',
      JSON.stringify(issuanceRequests, null, 2),
    )
    return issuanceRequests
  } catch (error) {
    console.error(
      'Could not find issuance requests by combination of identifiers from the database: ',
      error,
    )
  }
}

const readQueue = async function () {
  try {
    const requests = await IssuanceRequest.findAll({})

    //console.log('All requests:', JSON.stringify(requests, null, 2))
    return requests
  } catch (error) {
    console.error('Could not find issuance requests in the database: ', error)
  }
}

const updateRequest = async function (
  request_id,
  contact_id,
  invitation_id,
  schema_id,
  attributes,
  status,
) {
  try {
    const timestamp = Date.now()

    await IssuanceRequest.update(
      {
        request_id,
        contact_id,
        invitation_id,
        schema_id,
        attributes,
        status: status,
        updated_at: timestamp,
      },
      {
        where: {
          request_id: request_id,
        },
      },
    )
    const issuanceRequest = await readRequestsByConnectionId(invitation_id)
    return issuanceRequest
  } catch (error) {
    console.error('Error updating the issuance request: ', error)
  }
}

const updateRequestStatus = async function (request_id, status) {
  try {
    const timestamp = Date.now()

    const issuanceRequest = await IssuanceRequest.update(
      {
        request_id,
        status: status,
        updated_at: timestamp,
      },
      {
        where: {
          request_id: request_id,
        },
      },
    )

    return issuanceRequest
  } catch (error) {
    console.error('Error updating the issuance request: ', error)
  }
}

module.exports = {
  IssuanceRequest,
  addRequest,
  readRequestsByContactId,
  readRequestsByInvitationId,
  readRequestsByIdentifiers,
  readQueue,
  updateRequest,
  updateRequestStatus,
}
