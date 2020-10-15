const sendAdminMessage = require('./transport')

//Generate operations and requests to be sent to the Cloud Agent Adminstration API

//Create an invitation request message to be sent to the Cloud Agent Adminstration API
const createInvitation = async (alias = 'Single-Use Invitation', autoAccept = false, multiUse = false, public = false) => {
  try {
    console.log('Generating Invitation')

    const invitationMessage = await sendAdminMessage(
      'post',
      `/connections/create-invitation`,
      {
        alias,
        auto_accept: autoAccept,
        multi_use: multiUse,
        public
      },
      {},
    )

    return invitationMessage
  } catch (error) {
    console.error('Invitation Creation Error')
    throw error
  }
}

//Fetch a Connection request message to be sent to the Cloud Agent Adminstration API
const fetchConnection = async (connectionID) => {
  try {
    console.log(`Fetching a Connection with connectionID: ${connectionID}`)

    const connection = await sendAdminMessage(
      'get',
      `/connections/${connectionID}`,
      {},
      {},
    )

    return connection
  } catch (error) {
    if (error.response.status === 404) {
      console.log('No Connection Found')

      return null
    }

    console.error('Error Fetching Connection')
    throw error
  }
}

module.exports = {
  createInvitation,
  fetchConnection,
}
