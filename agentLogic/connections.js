const Connections = require('../orm/connections')

// const updateOrCreateConnection = async (
//   connection_id,
//   state,
//   my_did,
//   alias,
//   request_id,
//   invitation_key,
//   invitation_mode,
//   invitation_url,
//   invitation,
//   accept,
//   initiator,
//   their_role,
//   their_did,
//   their_label,
//   routing_state,
//   inbound_connection_id,
//   error_msg,
//   contact_id,
// ) => {

// }

const getAllPendingConnections = async (params = {}) => {
  try {
    const connections = await Connections.readPendingConnections(params)

    console.log('===========pending=============')
    console.log(connections)
    console.log('===========pending=============')
    return connections
  } catch (error) {
    console.log('Error while fetching pending connections:')
    console.error(error)
  }

  //send websocket message
}

const handleConnectionReuse = async (message) => {
  try {
    console.log('Handling connection reuse:', message)

    Websockets.sendMessageToAll('OUT_OF_BAND', 'CONNECTION_REUSE', {
      connection_id: message.connection_id,
      comment: message.comment,
    })
  } catch (error) {
    console.error('Error handling connection reuse:')
    console.error(error)
  }
}

module.exports = {
  getAllPendingConnections,
  handleConnectionReuse,
}
