const sendAdminMessage = require('./transport')

//Send an out-of-band message
const createOOBInvitation = async (
  protocol = 'did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/didexchange/1.0',
  alias = 'OOB Invitation',
  multiUse = false,
  autoAccept = true,
  public = true,
  label,
) => {
  try {
    console.log('Generate OOB Message:')

    const response = await sendAdminMessage(
      'post',
      '/out-of-band/create-invitation',
      {
        auto_accept: autoAccept,
        multi_use: multiUse,
      },
      {
        alias: alias,
        handshake_protocols: [protocol],
        my_label: label,
        use_public_did: public,
      },
    )

    return response
  } catch (error) {
    console.error('Error while sending out-of-band message!')
    throw error
  }
}

const acceptOOBInvitation = async (invitation) => {
  try {
    console.log('Accepting out-of-band invitation.')
    let parsedInvitation = JSON.parse(invitation)

    const invitationMessage = await sendAdminMessage(
      'post',
      `/out-of-band/receive-invitation`,
      {
        use_existing_connection: true,
        auto_accept: true,
      },
      parsedInvitation,
    )

    return invitationMessage
  } catch (error) {
    console.error('Error accepting OOB invitation!')
    throw error
  }
}

module.exports = {
  createOOBInvitation,
  acceptOOBInvitation,
}
