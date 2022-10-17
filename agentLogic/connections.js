const Websockets = require('../websockets')

const Connections = require('../orm/connections')

const getConnection = async (connection_id) => {
  try {
    const connection = await Connections.readConnection(connection_id)

    return connection
  } catch (error) {
    console.log('Error getting connection: ', error)
  }
}

const getConnections = async () => {
  try {
    const connections = await Connections.readConnections()

    return connections
  } catch (error) {
    console.log('Error getting connections: ', error)
  }
}

const getAllPendingConnections = async (params = {}) => {
  try {
    const connections = await Connections.readPendingConnections(params)

    return connections
  } catch (error) {
    console.log('Error while fetching pending connections:')
    console.error(error)
  }
}

const updateOrCreateConnection = async (
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
) => {
  try {
    const connection = await Connections.createOrUpdateConnection(
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
    )

    return connection
  } catch (error) {
    console.log('Error while updating or creating connection: ', error)
  }
}

const updateExistingConnection = async (
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
) => {
  try {
    const connection = await Connections.updateConnection(
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
    )

    return connection
  } catch (error) {
    console.log('Error while updating existing connection: ', error)
  }
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
  getConnection,
  getConnections,
  getAllPendingConnections,
  updateOrCreateConnection,
  updateExistingConnection,
  handleConnectionReuse,
}
