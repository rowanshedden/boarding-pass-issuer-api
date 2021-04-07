const Util = require('../util')
const AdminAPI = require('../adminAPI')

let Connections = require('../orm/connections.js')

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

// Create Single Use Invitation that supports Connection reuse
// (JamesKEbert) TODO: We've created a function for connection reuse, some stop gaps specific to overall project. Should move to using Public DIDs for this purpose, or build the capability in ACA-Py to generate invitations from a specific local-DID to allow key recognition from a client for connection reuse
const createPersistentSingleUseInvitation = async (workflow = 'moderator') => {
  try {
    console.log(
      `Creating/fetching reusable invitation with workflow ${workflow}`,
    )

    let reuseInvite = await Connections.readInvitationByAlias(
      '_CONNECTION_REUSE_INVITATION',
    )

    console.log(reuseInvite)

    let alteredInvitationRecord = {
      ...reuseInvite.dataValues,
    }

    alteredInvitationRecord.invitation['workflow'] = workflow

    let invitationJSON = JSON.stringify(alteredInvitationRecord.invitation)
    const invitationString =
      alteredInvitationRecord.invitation.serviceEndpoint +
      '?c_i=' +
      Util.encodeBase64(invitationJSON)

    console.log(invitationString)
    alteredInvitationRecord.invitation_url = invitationString

    // Return to the user that triggered the generation of that invitation
    return alteredInvitationRecord
  } catch (error) {
    console.error('Error Creating Invitation')
    throw error
  }
}

module.exports = {
  createSingleUseInvitation,
  createPersistentSingleUseInvitation,
}
