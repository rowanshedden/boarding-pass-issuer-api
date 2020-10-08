const AdminAPI = require('../adminAPI')

//Perform Agent Business Logic

//Create an invitation
const createInvitation = async () => {
  try {
    const invitationMessage = await AdminAPI.Connections.createInvitation()
    console.log(invitationMessage)

    const invitationURL = invitationMessage.invitation_url
    console.log(`Invitation URL: ${invitationURL}`)

    return invitationURL
  } catch (error) {
    console.error('Error Creating Invitation')
    throw error
  }
}

module.exports = {
  createInvitation,
}
