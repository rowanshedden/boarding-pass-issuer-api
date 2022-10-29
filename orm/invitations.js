const {Sequelize, DataTypes, Model} = require('sequelize')

const {findOffset} = require('./pagination')

const init = require('./init.js')
sequelize = init.connect()

// const {v4: uuid} = require('uuid')

class Invitation extends Model {}
exports.Invitation = Invitation

Invitation.init(
  {
    invitation_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      // allowNull: false,
    },
    oob_id: {type: DataTypes.TEXT, allowNull: true},
    contact_id: {type: DataTypes.TEXT, allowNull: true},
    connection_id: {type: DataTypes.TEXT, allowNull: true},
    my_did: {type: DataTypes.TEXT},
    alias: {type: DataTypes.TEXT},
    invitation_key: {type: DataTypes.TEXT},
    invitation_mode: {type: DataTypes.TEXT},
    invitation_url: {type: DataTypes.TEXT},
    invitation: {type: DataTypes.JSON},
    accept: {type: DataTypes.TEXT},
    their_role: {type: DataTypes.TEXT},
    their_label: {type: DataTypes.TEXT},
    service_endpoint: {type: DataTypes.TEXT},
    domain: {type: DataTypes.TEXT},
    path: {type: DataTypes.TEXT},
    workflow_status: {type: DataTypes.TEXT},
    state: {type: DataTypes.TEXT},
    description: {type: DataTypes.TEXT},
    active_starting_at: {type: DataTypes.DATE},
    active_ending_at: {type: DataTypes.DATE, allowNull: true},
    uses_allowed: {type: DataTypes.INTEGER, allowNull: true},
    uses_remaining: {type: DataTypes.INTEGER, allowNull: true},
    created_at: {type: DataTypes.DATE},
    updated_at: {type: DataTypes.DATE},
  },
  {
    sequelize, // Pass the connection instance
    modelName: 'Invitation',
    tableName: 'invitations', // Our table names don't follow the sequelize convention and thus must be explicitly declared
    timestamps: false,
  },
)

const createInvitation = async function (
  oob_id,
  contact_id,
  connection_id,
  my_did,
  alias,
  invitation_key,
  invitation_mode,
  invitation_url,
  invitation,
  accept,
  their_role,
  their_label,
  service_endpoint,
  domain,
  path,
  workflow_status,
  state,
  description,
  active_starting_at,
  active_ending_at,
  uses_allowed,
  uses_remaining,
) {
  try {
    const timestamp = Date.now()

    const invitationRecord = await Invitation.create({
      oob_id: oob_id ? oob_id : null,
      contact_id,
      connection_id: connection_id ? connection_id : null,
      my_did: my_did ? my_did : null,
      alias: alias,
      invitation_key: invitation_key ? invitation_key : '',
      invitation_mode: invitation_mode,
      invitation_url: invitation_url,
      invitation: invitation ? invitation : {},
      accept: accept,
      their_role: their_role,
      their_label: their_label,
      service_endpoint: service_endpoint ? service_endpoint : '',
      domain: domain ? domain : '',
      path: path ? path : '',
      workflow_status: workflow_status,
      state: state,
      description: description ? description : '',
      active_starting_at: active_starting_at ? active_starting_at : Date.now(),
      active_ending_at: active_ending_at ? active_ending_at : null,
      uses_allowed: uses_allowed ? uses_allowed : null,
      uses_remaining: uses_remaining ? uses_remaining : null,
      created_at: timestamp,
      updated_at: timestamp,
    })

    return invitationRecord
  } catch (error) {
    console.error('Error saving invitation to the database: ', error)
  }
}

const readInvitationByInvitationId = async function (invitation_id) {
  console.log('readInvitationByInvitationId')
  try {
    const invitation = await Invitation.findAll({
      where: {
        invitation_id,
      },
    })

    console.log('Requested invitation:', JSON.stringify(invitation[0], null, 2))

    return invitation[0]
  } catch (error) {
    console.error('Could not find invitation by id in the database: ', error)
  }
}

const readInvitationByOOBId = async function (oob_id) {
  try {
    const invitation = await Invitation.findAll({
      where: {
        oob_id,
      },
    })
    return invitation[0]
  } catch (error) {
    console.error('Could not find invitation by id in the database: ', error)
  }
}

const readInvitationByConnectionId = async function (connection_id) {
  try {
    const invitation = await Invitation.findAll({
      where: {
        connection_id,
      },
    })
    return invitation[0]
  } catch (error) {
    console.error(
      'Could not find invitation by connection id in the database: ',
      error,
    )
  }
}

const readInvitations = async function (params = {}) {
  try {
    const sort = params.sort ? params.sort : [['created_at', 'ASC']]
    const pageSize = params.pageSize ? params.pageSize : 2
    const currentPage = params.currentPage ? params.currentPage : 1
    const pageCount = params.pageCount ? params.pageCount : 1
    const itemCount = params.itemCount ? params.itemCount : undefined

    const rawInvitations = await Invitation.findAndCountAll({
      order: sort,
      offset: await findOffset(pageSize, currentPage, itemCount),
      limit: pageSize,
    })
    let newPageCount = Math.ceil(rawInvitations.count / pageSize)
    if (newPageCount === 0) newPageCount = 1

    const invitations = {
      params: {
        sort: sort,
        pageSize: pageSize,
        currentPage: currentPage,
        pageCount: newPageCount,
        itemCount: rawInvitations.count,
      },
      rows: rawInvitations.rows,
      count: rawInvitations.count,
    }

    // console.log('All invitations:', JSON.stringify(invitations, null, 2))

    return invitations
  } catch (error) {
    console.error('Could not find invitations in the database: ', error)
  }
}

const readInvitationsByContactId = async function (contact_id) {
  try {
    const invitations = await Invitation.findAll({
      where: {
        contact_id,
      },
    })

    console.log('Invitations orm test:', invitations)

    return invitations
  } catch (error) {
    console.error(
      'Could not find invitations by contact id in the database: ',
      error,
    )
  }
}

const updateInvitationByOOB = async function (
  oob_id,
  contact_id,
  connection_id,
  my_did,
  alias,
  invitation_key,
  invitation_mode,
  invitation_url,
  invMessage,
  accept,
  their_role,
  their_label,
  service_endpoint,
  domain,
  path,
  workflow_status,
  state,
  description,
  active_starting_at,
  active_ending_at,
  uses_allowed,
  uses_remaining,
) {
  try {
    const timestamp = Date.now()
    let argumentsObj = {
      oob_id: oob_id,
      contact_id: contact_id,
      connection_id: connection_id,
      my_did: my_did,
      alias: alias,
      invitation_key: invitation_key,
      invitation_mode: invitation_mode,
      invitation_url: invitation_url,
      invitation: invMessage,
      accept: accept,
      their_role: their_role,
      their_label: their_label,
      service_endpoint: service_endpoint,
      domain: domain,
      path: path,
      workflow_status: workflow_status,
      state: state,
      description: description,
      active_starting_at: active_starting_at,
      active_ending_at: active_ending_at,
      uses_allowed: uses_allowed,
      uses_remaining: uses_remaining,
    }

    // (AmmonBurgi) Removes arguments with undefined values. This allows for selective updating.
    Object.keys(argumentsObj).forEach(
      (arg) => argumentsObj[arg] === undefined && delete argumentsObj[arg],
    )

    const invitationRecord = await Invitation.update(
      {
        ...argumentsObj,
        updated_at: timestamp,
      },
      {
        where: {
          oob_id: oob_id,
        },
        returning: true,
      },
    )
    // Select results [1], select the first result [0]
    console.log('Invitation updated successfully.')
    return invitationRecord[1][0]
  } catch (error) {
    console.error('Error updating the Invitation: ', error)
  }
}

const deleteInvitation = async function (invitation_id) {
  try {
    await Invitation.destroy({
      where: {
        invitation_id: invitation_id,
      },
    })

    console.log('Invitation was successfully deleted')
  } catch (error) {
    console.error('Error while deleting Invitation: ', error)
  }
}

module.exports = {
  Invitation,
  createInvitation,
  readInvitationByInvitationId,
  readInvitationByOOBId,
  readInvitationByConnectionId,
  readInvitations,
  readInvitationsByContactId,
  updateInvitationByOOB,
  deleteInvitation,
}
