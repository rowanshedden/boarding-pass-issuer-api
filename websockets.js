const WebSocket = require('ws')
const server = require('./index.js').server

const ControllerError = require('./errors.js')

const Invitations = require('./agentLogic/invitations')
const Credentials = require('./agentLogic/credentials')

wss = new WebSocket.Server({server: server, path: '/api/ws'})
console.log('Websockets Setup')

wss.on('connection', (ws) => {
  console.log('New Connection')

  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message)
      console.log('New Websocket Message:', parsedMessage)

      messageHandler(ws, parsedMessage.context, parsedMessage.type, parsedMessage.data)
    } catch (error) {
      console.error(error)
    }
  })
})

//Send an outbound message to a websocket client
const sendMessage = (ws, context, type, data = {}) => {
  console.log(`Sending Message to websocket client of type: ${type}`)
  try {
    ws.send(JSON.stringify({context, type, data}))
  } catch (error) {
    console.error(error)
    throw error
  }
}

//Send an Error Message to a websocket client
const sendErrorMessage = (ws, errorCode, errorReason) => {
  try {
    console.log('Sending Error Message')

    sendMessage(ws, 'ERROR', 'SERVER_ERROR', {errorCode, errorReason})
  } catch (error) {
    console.error('Error Sending Error Message to Client')
    console.error(error)
  }
}

//Send a message to all connected clients
const sendMessageToAll = (context, type, data = {}) => {
  try {
    console.log(
      `Sending Message to all websocket clients of type: ${type}`,
    )

    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        console.log('Sending Message to Client')
        client.send(JSON.stringify({context, type, data}))
      } else {
        console.log('Client Not Ready')
      }
    })
  } catch (error) {
    console.error('Error Sending Message to All Clients')
    throw error
  }
}

//Handle inbound messages
const messageHandler = async (ws, context, type, data = {}) => {
  try {
    switch (context) {
      case 'CONTACTS':
        console.log(`CONTACTS Message`)

        switch(type){
          case 'GET_ALL':
            console.log("GET_ALL")

            break;
          default:
            console.error(`Unrecognized Message Type: ${type}`)
            sendErrorMessage(ws, 1, 'Unrecognized Message Type')
            break;
        }

        break
      /*case 'INVITATIONS':
        console.log('Create Invitation Requested')

        const invitationURL = await Invitations.createInvitation()
        sendMessage(ws, 'NEW_INVITATION', {invitationURL})

        break
      case 'AUTO_ISSUE_CREDENTIAL':
        console.log('Auto Issuing Credential')

        await Credentials.autoIssueCredential(
          messageData.connectionID,
          messageData.issuerDID,
          messageData.credDefID,
          messageData.schemaID,
          messageData.schemaVersion,
          messageData.schemaName,
          messageData.schemaIssuerDID,
          messageData.comment,
          messageData.attributes,
        )

        sendMessage(ws, 'CREDENTIAL_OFFERED', {})
        break*/
      default:
        console.error(`Unrecognized Message Context: ${context}`)
        sendErrorMessage(ws, 1, 'Unrecognized Message Context')
        break
    }
  } catch (error) {
    if (error instanceof ControllerError) {
      console.error('Controller Error in Message Handling', error)
      sendErrorMessage(ws, error.code, error.reason)
    } else {
      console.error('Error In Websocket Message Handling', error)
      sendErrorMessage(ws, 0, 'Internal Error')
    }
  }
}

module.exports = {
  sendMessageToAll,
}
