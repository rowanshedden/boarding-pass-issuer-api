const WebSocket = require('ws')
const server = require('./index.js').server

const ControllerError = require('./errors.js')

wss = new WebSocket.Server({server: server, path: '/api/ws'})
console.log('Websockets Setup')

// Send a message to all connected clients
const sendMessageToAll = (context, type, data = {}) => {
  try {
    console.log(`Sending Message to all websocket clients of type: ${type}`)

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

// (JamesKEbert)TODO: Add a connection timeout to gracefully exit versus nginx configuration closing abrubtly
wss.on('connection', (ws) => {
  console.log('New Websocket Connection')

  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message)
      console.log('New Websocket Message:', parsedMessage)

      messageHandler(
        ws,
        parsedMessage.context,
        parsedMessage.type,
        parsedMessage.data,
      )
    } catch (error) {
      console.error(error)
    }
  })

  ws.on('close', (code, reason) => {
    console.log('Websocket Connection Closed', code, reason)
  })

  ws.on('ping', (data) => {
    console.log('Ping')
  })
  ws.on('pong', (data) => {
    console.log('Pong')
  })
})

// Send an outbound message to a websocket client
const sendMessage = (ws, context, type, data = {}) => {
  console.log(`Sending Message to websocket client of type: ${type}`)
  try {
    ws.send(JSON.stringify({context, type, data}))
  } catch (error) {
    console.error(error)
    throw error
  }
}

// Send an Error Message to a websocket client
const sendErrorMessage = (ws, errorCode, errorReason) => {
  try {
    console.log('Sending Error Message')

    sendMessage(ws, 'ERROR', 'SERVER_ERROR', {errorCode, errorReason})
  } catch (error) {
    console.error('Error Sending Error Message to Client')
    console.error(error)
  }
}

// Handle inbound messages
const messageHandler = async (ws, context, type, data = {}) => {
  try {
    console.log(`New Message with context: '${context}' and type: '${type}'`)
    switch (context) {
      case 'INVITATIONS':
        switch (type) {
          case 'CREATE_SINGLE_USE':
            var invitation
            if (data.workflow) {
              invitation = await Invitations.createPersistentSingleUseInvitation(
                data.workflow,
              )
            } else {
              invitation = await Invitations.createSingleUseInvitation()
            }
            sendMessage(ws, 'INVITATIONS', 'INVITATION', {
              invitation_record: invitation,
            })

            break
          default:
            console.error(`Unrecognized Message Type: ${type}`)
            sendErrorMessage(ws, 1, 'Unrecognized Message Type')
            break
        }
        break
      case 'CONTACTS':
        switch (type) {
          case 'GET_ALL':
            const contacts = await Contacts.getAll(data.additional_tables)

            sendMessage(ws, 'CONTACTS', 'CONTACTS', {contacts})

            break
          case 'GET':
            const contact = await Contacts.getContact(
              data.contact_id,
              data.additional_tables,
            )

            sendMessage(ws, 'CONTACTS', 'CONTACTS', {contacts: [contact]})

            break
          default:
            console.error(`Unrecognized Message Type: ${type}`)
            sendErrorMessage(ws, 1, 'Unrecognized Message Type')
            break
        }
        break
      case 'DEMOGRAPHICS':
        switch (type) {
          case 'UPDATE_OR_CREATE':
            await Demographics.updateOrCreateDemographic(
              data.contact_id,
              data.mpid,
              data.first_name,
              data.middle_name,
              data.last_name,
              data.date_of_birth,
              data.gender,
              data.phone,
              data.address,
            )
            break
          default:
            console.error(`Unrecognized Message Type: ${type}`)
            sendErrorMessage(ws, 1, 'Unrecognized Message Type')
            break
        }
        break
      case 'SETTINGS':
        switch (type) {
          case 'SET_THEME':
            console.log('SET_THEME')
            const updatedTheme = await Settings.setTheme(data)
            sendMessage(ws, 'SETTINGS', 'THEME_SETTINGS', updatedTheme)
            break
          default:
            console.log('GET_THEME')
            const currentTheme = await Settings.getTheme()
            sendMessage(ws, 'SETTINGS', 'THEME_SETTINGS', currentTheme)
            break
        }
        break
      case 'CREDENTIALS':
        switch (type) {
          case 'ISSUE_USING_SCHEMA':
            await Credentials.autoIssueCredential(
              data.connectionID,
              data.issuerDID,
              data.credDefID,
              data.schemaID,
              data.schemaVersion,
              data.schemaName,
              data.schemaIssuerDID,
              data.comment,
              data.attributes,
            )
            break
          case 'GET':
            const credentialRecord = await Credentials.getCredential(
              data.credential_exchange_id,
            )

            sendMessage(ws, 'CREDENTIALS', 'CREDENTIALS', {
              credential_records: [credentialRecord],
            })
            break
          case 'GET_ALL':
            const credentialRecords = await Credentials.getAll()

            sendMessage(ws, 'CREDENTIALS', 'CREDENTIALS', {
              credential_records: credentialRecords,
            })
            break
          default:
            console.error(`Unrecognized Message Type: ${type}`)
            sendErrorMessage(ws, 1, 'Unrecognized Message Type')
            break
        }
        break
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

const Invitations = require('./agentLogic/invitations')
const Demographics = require('./agentLogic/demographics')
const Contacts = require('./agentLogic/contacts')
const Credentials = require('./agentLogic/credentials')
const Settings = require('./agentLogic/settings')
