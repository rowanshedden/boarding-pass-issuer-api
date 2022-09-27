const Connections = require('../orm/connections')

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

module.exports = {
  getAllPendingConnections,
}
