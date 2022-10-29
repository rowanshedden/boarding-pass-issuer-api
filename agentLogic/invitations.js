const Util = require('../util')
const AdminAPI = require('../adminAPI')

let Connections = require('../orm/connections.js')
let Invitations = require('../orm/invitations.js')

const base64url = require('base64url')

// Perform Agent Business Logic

// Create an invitation
const createSingleUseInvitation = async (
  alias = 'default',
  autoAccept = true,
  multiUse = false,
  public = false,
) => {
  try {
    const invitationMessage = await AdminAPI.Connections.createInvitation(
      alias,
      autoAccept,
      multiUse,
      public,
    )
    console.log(invitationMessage)

    await Connections.createOrUpdateConnection(
      invitationMessage.connection_id,
      'invitation',
      null,
      invitationMessage.alias,
      null,
      null,
      null,
      invitationMessage.invitation_url,
      invitationMessage.invitation,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    )

    // (JamesKEbert) TODO: Strategy of invitations, specifically broadcasting to users
    const invitation = await Connections.readConnection(
      invitationMessage.connection_id,
    )

    // Return to the user that triggered the generation of that invitation
    return invitation
  } catch (error) {
    console.error('Error Creating Invitation')
    throw error
  }
}

const acceptInvitation = async (invitation_url) => {
  try {
    // Decoding the invitation url
    const url = new URL(invitation_url)
    const encodedParam = url.searchParams.get('c_i')
    const decodedInvitation = base64url.decode(encodedParam)

    const invitationMessage = await AdminAPI.Connections.acceptInvitation(
      decodedInvitation,
    )

    // Return some info about the new connection formed by accepting the invite so we can take further action
    return invitationMessage
  } catch (error) {
    console.error('Error Accepting Invitation')
    throw error
  }
}

const acceptOutOfBandInvitation = async (invitation_url) => {
  try {
    // Decoding the invitation url
    const url = new URL(invitation_url)
    const encodedParam = url.searchParams.get('oob')
    const decodedOOBInvitation = base64url.decode(encodedParam)

    const invitationMessage = await AdminAPI.OOB.acceptOOBInvitation(
      decodedOOBInvitation,
    )

    return invitationMessage
  } catch (error) {
    console.error('Error accepting out-of-band invitation!')
    throw error
  }
}

const createInvitation = async (
  contact_id,
  alias = 'default',
  invitation_mode = 'once',
  accept = 'auto',
  public = 'false',
  their_role = '',
  their_label = '',
  workflow_status = 'active',
  description = '',
  active_starting_at = Date.now(),
  active_ending_at = null,
  uses_allowed = '',
) => {
  try {
    const invitationMessage = await AdminAPI.Connections.createInvitation(
      alias,
      accept === 'auto' ? true : false,
      invitation_mode === 'multi' ? true : false,
      public,
    )

    await Connections.createOrUpdateConnection(
      invitationMessage.connection_id,
      'invitation',
      null,
      invitationMessage.alias,
      null,
      invitationMessage.invitation_key,
      invitationMessage.invitation_mode,
      invitationMessage.invitation_url,
      invitationMessage.invitation,
      invitationMessage.accept,
      invitationMessage.initiator,
      invitationMessage.their_role,
      invitationMessage.their_did,
      invitationMessage.their_label,
      null,
      null,
      null,
      contact_id,
    )

    const invitation = await Invitations.createInvitation(
      null,
      contact_id,
      invitationMessage.connection_id,
      null,
      alias,
      invitationMessage.invitation_key,
      invitation_mode,
      invitationMessage.invitation_url,
      invitationMessage.invitation,
      accept,
      their_role,
      their_label,
      invitationMessage.invitation.serviceEndpoint,
      null,
      null,
      workflow_status,
      invitationMessage.state,
      description,
      active_starting_at,
      active_ending_at,
      uses_allowed,
      null,
    )

    if (invitation) {
      const allInvRecords = await Invitations.readInvitations({
        sort: [[['updated_at', 'DESC']]],
        pageSize: '10',
      })

      return {invitation_record: allInvRecords, newInv: invitation}
    }
  } catch (error) {
    console.error('Error Creating Invitation')
    throw error
  }
}

const getAll = async (params) => {
  try {
    const invitationsList = await Invitations.readInvitations(params)

    console.log('Got All Invitations')

    return invitationsList
  } catch (error) {
    console.error('Error Fetching Invitations')
    throw error
  }
}

const getInvitation = async (invitation_id) => {
  try {
    const invitationRecord = await Invitations.readInvitationByInvitationId(
      invitation_id,
    )

    console.log('Invitation Record:', invitationRecord)

    return invitationRecord
  } catch (error) {
    console.error('Error Fetching Invitation Record')
    throw error
  }
}

const getInvitationsByContactId = async function (contact_id) {
  try {
    const invitations = await Invitations.readInvitationsByContactId(contact_id)
    return invitations
  } catch (error) {
    console.error('Invitations were not found', error)
  }
}

const deleteInvitation = async function (invitationId) {
  try {
    const deletedInvitation = await Invitations.deleteInvitation(invitationId)

    console.log('Invitation Deleted')

    // Return true to trigger a success message
    return true
  } catch (error) {
    console.error('Error Fetching Invitation')
    throw error
  }
}

const acceptExistingInvitation = async (connection_id) => {
  try {
    // Decoding the invitation url
    const invitationMessage = await AdminAPI.Connections.acceptExistingInvitation(
      connection_id,
    )

    // Return some info about the new connection formed by accepting the invite so we can take further action
    return invitationMessage
  } catch (error) {
    console.error('Error Accepting Invitation')
    throw error
  }
}

const createOutOfBandInvitation = async (
  contact_id,
  handshake_protocol,
  alias,
  invitation_mode,
  accept,
  public,
  role,
  label,
  status,
  description,
  active_starting_at,
  active_ending_at,
  uses_allowed,
) => {
  try {
    let invitationAlias
    if (alias) {
      invitationAlias = alias
    } else {
      const organization = await Settings.getOrganization()
      invitationAlias = organization.dataValues.value.organizationName
    }

    const OOBMessage = await AdminAPI.OOB.createOOBInvitation(
      handshake_protocol,
      invitationAlias,
      invitation_mode === 'multi' ? true : false,
      accept === 'auto' ? true : false,
      public,
      label,
    )

    const services = OOBMessage.invitation.services[0]
    const publicDID = typeof services === 'string' ? services : null
    const serviceEndpoint =
      typeof services !== 'string' ? services.serviceEndpoint : null

    const invitation = await Invitations.createInvitation(
      OOBMessage.oob_id,
      contact_id,
      undefined,
      publicDID,
      invitationAlias,
      undefined,
      invitation_mode,
      OOBMessage.invitation_url,
      OOBMessage.invitation,
      accept,
      role,
      label,
      serviceEndpoint,
      undefined,
      undefined,
      status,
      OOBMessage.state,
      description,
      active_starting_at,
      active_ending_at,
      uses_allowed,
      undefined,
    )

    console.log('Invitation with OOB')
    console.log(invitation)

    if (invitation) {
      const allInvRecords = await Invitations.readInvitations({
        sort: [[['updated_at', 'DESC']]],
        pageSize: '10',
      })

      return {invitation_record: allInvRecords, oobInv: invitation}
    }
  } catch (error) {
    console.error('Error sending out-of-band message!')
    throw error
  }
}

const getInvitationByOOBId = async (oob_id) => {
  try {
    const invitationRecord = await Invitations.readInvitationByOOBId(oob_id)

    return invitationRecord
  } catch (error) {
    console.error('Error Fetching Invitation Record')
    throw error
  }
}

const getInvitationByConnectionId = async (connection_id) => {
  try {
    const invitationRecord = await Invitations.readInvitationByConnectionId(
      connection_id,
    )

    return invitationRecord
  } catch (error) {
    console.error('Error Fetching Invitation Record')
    throw error
  }
}

const updateOOBInvRecord = async (
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
) => {
  try {
    const invitationRecord = await Invitations.updateInvitationByOOB(
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
    )

    if (invitationRecord) {
      const updatedInv = await Invitations.readInvitations({
        sort: [[['updated_at', 'DESC']]],
        pageSize: '10',
      })

      Websockets.sendMessageToAll('INVITATIONS', 'INVITATIONS', updatedInv)
    }

    return invitationRecord
  } catch (error) {
    console.error(error)
    console.error('Error updating invitation connection!')
  }
}

const updateAvailableOOBInvitation = async (message) => {
  try {
    let iteration = 1
    let updateInterval = setInterval(async () => {
      const invRecord = await getInvitationByOOBId(message.oob_id)

      if (invRecord) {
        await updateOOBInvRecord(
          message.connection_id,
          message.oob_id,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          invRecord.dataValues.their_role ? undefined : message.role,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          message.state,
        )
        clearInterval(updateInterval)
      }

      if (iteration < 5) {
        iteration++
      } else {
        clearInterval(updateInterval)
        console.log('Warning: No Invitation available to update!')
      }
    }, 500)
  } catch (err) {
    console.log(err)
  }
}

module.exports = {
  createSingleUseInvitation,
  acceptInvitation,
  acceptExistingInvitation,
  acceptOutOfBandInvitation,
  createOutOfBandInvitation,
  createInvitation,
  deleteInvitation,
  getAll,
  getInvitation,
  getInvitationsByContactId,
  getInvitationByOOBId,
  getInvitationByConnectionId,
  updateOOBInvRecord,
  updateAvailableOOBInvitation,
}
