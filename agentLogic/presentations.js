const ControllerError = require('../errors.js')

const AdminAPI = require('../adminAPI')
const Websockets = require('../websockets.js')

const requestPresentation = async (connectionID) => {
  console.log(`Requesting Presentation from Connection: ${connectionID}`)

  AdminAPI.Presentations.requestPresentation(
    connectionID,
    ['attribute_1', 'attribute_2'],
    'XDfTygX4ZrbdSr1HiBqef1:2:Schema:1.0',
    'Requesting Presentation',
    false,
  )
}

const adminMessage = async (message) => {
  console.log('Received Presentations Message', message)

  if (message.state === 'verified') {
    console.log('Employee has been verified')
    Websockets.sendMessageToAll('PRESENTATIONS', 'EMPLOYEE_VERIFIED', {
      connection_id: message.connection_id,
    })
  }
}

module.exports = {
  adminMessage,
  requestPresentation,
}
