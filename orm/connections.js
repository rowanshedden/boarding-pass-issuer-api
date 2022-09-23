const {Sequelize, DataTypes, Model} = require('sequelize')

const init = require('./init.js')
sequelize = init.connect()

const {Contact} = require('./contacts.js')
const {findOffset} = require('./pagination.js')

class Connection extends Model {}

Connection.init(
  {
    connection_id: {
      type: DataTypes.TEXT,
      unique: true,
      primaryKey: true,
      allowNull: false,
    },
    state: {
      type: DataTypes.TEXT,
    },
    my_did: {
      type: DataTypes.TEXT,
    },
    alias: {
      type: DataTypes.TEXT,
    },
    request_id: {
      type: DataTypes.TEXT,
    },
    invitation_key: {
      type: DataTypes.TEXT,
    },
    invitation_mode: {
      type: DataTypes.TEXT,
    },
    invitation_url: {
      type: DataTypes.TEXT,
    },
    invitation: {
      type: DataTypes.JSON,
    },
    accept: {
      type: DataTypes.TEXT,
    },
    initiator: {
      type: DataTypes.TEXT,
    },
    their_role: {
      type: DataTypes.TEXT,
    },
    their_did: {
      type: DataTypes.TEXT,
    },
    their_label: {
      type: DataTypes.TEXT,
    },
    routing_state: {
      type: DataTypes.TEXT,
    },
    inbound_connection_id: {
      type: DataTypes.TEXT,
    },
    error_msg: {
      type: DataTypes.TEXT,
    },
    contact_id: {
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
    modelName: 'Connection',
    tableName: 'connections', // Our table names don't follow the sequelize convention and thus must be explicitly declared
    timestamps: false,
  },
)

Contact.hasMany(Connection, {
  foreignKey: 'contact_id',
})

const createConnection = async function (
  connection_id,
  state,
  my_did,
  alias,
  request_id,
  invitation_key,
  invitation_mode,
  invitation_url,
  invitation,
  accept,
  initiator,
  their_role,
  their_did,
  their_label,
  routing_state,
  inbound_connection_id,
  error_msg,
) {
  try {
    const timestamp = Date.now()

    const connection = await Connection.create({
      connection_id: connection_id,
      state: state,
      my_did: my_did,
      alias: alias,
      request_id: request_id,
      invitation_key: invitation_key,
      invitation_mode: invitation_mode,
      invitation_url: invitation_url,
      invitation: invitation,
      accept: accept,
      initiator: initiator,
      their_role: their_role,
      their_did: their_did,
      their_label: their_label,
      routing_state: routing_state,
      inbound_connection_id: inbound_connection_id,
      error_msg: error_msg,
      created_at: timestamp,
      updated_at: timestamp,
    })

    console.log('Connection saved successfully.')
    return connection
  } catch (error) {
    console.error('Error saving connection to the database: ', error)
  }
}

const createOrUpdateConnection = async function (
  connection_id,
  state,
  my_did,
  alias,
  request_id,
  invitation_key,
  invitation_mode,
  invitation_url,
  invitation,
  accept,
  initiator,
  their_role,
  their_did,
  their_label,
  routing_state,
  inbound_connection_id,
  error_msg,
  contact_id,
) {
  try {
    const connection = await sequelize.transaction(
      {
        isolationLevel: Sequelize.Transaction.SERIALIZABLE,
      },
      async (t) => {
        let connection = await Connection.findOne({
          where: {
            connection_id: connection_id,
          },
        })

        const timestamp = Date.now()

        // (JamesKEbert) TODO: Change upsert for a better mechanism, such as locking potentially.
        if (!connection) {
          console.log('Creating Connection')
          connection = await Connection.upsert({
            connection_id: connection_id,
            state: state,
            my_did: my_did,
            alias: alias,
            request_id: request_id,
            invitation_key: invitation_key,
            invitation_mode: invitation_mode,
            invitation_url: invitation_url,
            invitation: invitation,
            accept: accept,
            initiator: initiator,
            their_role: their_role,
            their_did: their_did,
            their_label: their_label,
            routing_state: routing_state,
            inbound_connection_id: inbound_connection_id,
            error_msg: error_msg,
            contact_id,
            created_at: timestamp,
            updated_at: timestamp,
          })
        } else {
          console.log('Updating Connection')
          connection = await Connection.update(
            {
              connection_id: connection_id,
              state: state,
              my_did: my_did,
              alias: alias,
              request_id: request_id,
              invitation_key: invitation_key,
              invitation_mode: invitation_mode,
              invitation_url: invitation_url,
              invitation: invitation,
              accept: accept,
              initiator: initiator,
              their_role: their_role,
              their_did: their_did,
              their_label: their_label,
              routing_state: routing_state,
              inbound_connection_id: inbound_connection_id,
              error_msg: error_msg,
              contact_id,
              updated_at: timestamp,
            },
            {
              where: {
                connection_id: connection_id,
              },
            },
          )
        }

        return connection
      },
    )

    console.log('Connection saved successfully.')
    return connection
  } catch (error) {
    console.error('Error saving connection to the database: ', error)
  }
}

const readConnection = async function (connection_id) {
  try {
    const connection = await Connection.findAll({
      where: {
        connection_id: connection_id,
      },
    })

    return connection[0]
  } catch (error) {
    console.error('Could not find connection in the database: ', error)
  }
}

const readConnectionWithContact = async function (connection_id) {
  try {
    const connection = await Connection.findAll({
      where: {
        connection_id: connection_id,
      },
      include: [
        {
          model: Contact,
          required: false,
        },
      ],
    })

    return connection[0]
  } catch (error) {
    console.error('Could not find connection in the database: ', error)
  }
}

// const readConnections = async function () {
//   try {
//     const connections = await Connection.findAll({
//       include: [
//         {
//           model: Contact,
//           required: false,
//         },
//       ],
//     })

//     return connections
//   } catch (error) {
//     console.error('Could not find connections in the database: ', error)
//   }
// }

const readConnections = async function (params = {}) {
  try {
    const sort = params.sort ? params.sort : [['updated_at', 'ASC']]
    const pageSize = params.pageSize ? params.pageSize : 2
    const currentPage = params.currentPage ? params.currentPage : 1
    const pageCount = params.pageCount ? params.pageCount : 1
    const itemCount = params.itemCount ? params.itemCount : undefined

    const rawConnections = await Connection.findAndCountAll({
      order: sort,
      offset: await findOffset(pageSize, currentPage, itemCount),
      limit: pageSize,
    })

    let newPageCount = Math.ceil(rawConnections.count / pageSize)
    if (newPageCount === 0) newPageCount = 1

    // (mikekebert) We send back the data, the new item count (in case it has changed), and the new calculated page count (in case it has changed)
    // We also send back the original parameters that were used to retrieve this data so that the client can understand how the data was derived
    const connections = {
      params: {
        sort: sort,
        pageSize: pageSize,
        currentPage: currentPage,
        pageCount: newPageCount,
        itemCount: rawConnections.count,
      },
      rows: rawConnections.rows,
      count: rawConnections.count,
    }

    return connections
  } catch (error) {
    console.error('Could not find connections in the database: ', error)
  }
}

const readInvitations = async function (connection_id) {
  try {
    const invitations = await Connection.findAll({
      where: {
        state: 'invitation',
      },
    })

    console.log('All invitations:', JSON.stringify(invitations, null, 2))
    return invitations
  } catch (error) {
    console.error('Could not find connection in the database: ', error)
  }
}

const readInvitationByAlias = async function (alias) {
  try {
    const connection = await Connection.findAll({
      where: {
        state: 'invitation',
        alias,
      },
    })

    console.log('Requested Invitation:', JSON.stringify(connection[0], null, 2))
    return connection[0]
  } catch (error) {
    console.error('Could not find invitation in the database: ', error)
  }
}

const updateConnection = async function (
  connection_id,
  state,
  my_did,
  alias,
  request_id,
  invitation_key,
  invitation_mode,
  invitation_url,
  invitation,
  accept,
  initiator,
  their_role,
  their_did,
  their_label,
  routing_state,
  inbound_connection_id,
  error_msg,
  contact_id,
) {
  try {
    const timestamp = Date.now()

    const connection = await Connection.update(
      {
        connection_id: connection_id,
        state: state,
        my_did: my_did,
        alias: alias,
        request_id: request_id,
        invitation_key: invitation_key,
        invitation_mode: invitation_mode,
        invitation_url: invitation_url,
        invitation: invitation,
        accept: accept,
        initiator: initiator,
        their_role: their_role,
        their_did: their_did,
        their_label: their_label,
        routing_state: routing_state,
        inbound_connection_id: inbound_connection_id,
        error_msg: error_msg,
        contact_id: contact_id,
        updated_at: timestamp,
      },
      {
        where: {
          connection_id: connection_id,
        },
        returning: true,
      },
    )

    console.log('Connection updated successfully.')
    return connection
  } catch (error) {
    console.error('Error updating the Connection: ', error)
  }
}

const deleteConnection = async function (connection_id) {
  try {
    await Connection.destroy({
      where: {
        connection_id: connection_id,
      },
    })

    console.log('Successfully deleted connection')
  } catch (error) {
    console.error('Error while deleting connection: ', error)
  }
}

module.exports = {
  Connection,
  createConnection,
  createOrUpdateConnection,
  readConnection,
  readConnectionWithContact,
  readConnections,
  readInvitationByAlias,
  readInvitations,
  updateConnection,
  deleteConnection,
}
