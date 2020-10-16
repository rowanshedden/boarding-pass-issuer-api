const AdminAPI = require('../adminAPI')

let Connections = require('../orm/connections.js')

//Perform Agent Business Logic

//Create an invitation 
const createSingleUseInvitation = async (alias) => {
  try {
    const invitationMessage = await AdminAPI.Connections.createInvitation(alias, true, false, false)
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

    //(JamesKEbert)TODO: Strategy of invitations, specifically broadcasting to users
    const invitation = await Connections.readConnection(invitationMessage.connection_id)

    //Return to the user that triggered the generation of that invitation
    return invitation
  } catch (error) {
    console.error('Error Creating Invitation')
    throw error
  }
}

module.exports = {
  createSingleUseInvitation,
}
