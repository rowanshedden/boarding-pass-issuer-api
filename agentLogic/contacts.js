const AdminAPI = require('../adminAPI')
const Websockets = require('../websockets.js')

const Connections = require('../agentLogic/connections')
const IssuanceRequests = require('../agentLogic/issuanceRequests')

const Contacts = require('../orm/contacts.js')
const ContactsCompiled = require('../orm/contactsCompiled.js')

const {v4: uuid} = require('uuid')

// Perform Agent Business Logic

// Fetch an existing connection
const fetchConnection = async (connectionID) => {
  try {
    // (JamesKEbert) TODO:Change to use Controller DB versus Admin API Call
    const connection = await AdminAPI.Connections.fetchConnection(connectionID)

    return connection
  } catch (error) {
    console.error('Error Fetching Connection')
    throw error
  }
}

const getContact = async (contactID, additionalTables) => {
  try {
    const contact = await ContactsCompiled.readContact(
      contactID,
      additionalTables,
    )

    console.log('Contact:', contact)

    return contact
  } catch (error) {
    console.error('Error Fetching Contact')
    throw error
  }
}

const getContactByConnection = async (connectionID, additionalTables) => {
  try {
    const contact = await ContactsCompiled.readContactByConnection(
      connectionID,
      additionalTables,
    )

    console.log('Contact:', contact)

    return contact
  } catch (error) {
    console.error('Error Fetching Contact')
    throw error
  }
}

const getAll = async (params, additionalTables) => {
  try {
    const contacts = await ContactsCompiled.readContacts(
      params,
      additionalTables,
    )

    console.log('Got All Contacts')

    return contacts
  } catch (error) {
    console.error('Error Fetching Contacts')
    throw error
  }
}

const adminMessage = async (connectionMessage) => {
  try {
    console.log('Received new Admin Webhook Message', connectionMessage)

    if (connectionMessage.state === 'invitation') {
      console.log('State - Invitation')

      await Connections.updateOrCreateConnection(
        connectionMessage.connection_id,
        connectionMessage.state,
        connectionMessage.my_did,
        connectionMessage.alias,
        connectionMessage.request_id,
        connectionMessage.invitation_key,
        connectionMessage.invitation_mode,
        connectionMessage.invitation_url,
        connectionMessage.invitation,
        connectionMessage.accept,
        connectionMessage.initiator,
        connectionMessage.their_role,
        connectionMessage.their_did,
        connectionMessage.their_label,
        connectionMessage.routing_state,
        connectionMessage.inbound_connection_id,
        connectionMessage.error_msg,
      )
      // Broadcast the invitation in the invitation agent logic
      return
    }

    let contact

    if (
      connectionMessage.state === 'request' ||
      connectionMessage.state === 'response'
    ) {
      console.log('State - Request or Response')

      await Connections.updateOrCreateConnection(
        connectionMessage.connection_id,
        connectionMessage.state,
        connectionMessage.my_did,
        connectionMessage.alias,
        connectionMessage.request_id,
        connectionMessage.invitation_key,
        connectionMessage.invitation_mode,
        connectionMessage.invitation_url,
        connectionMessage.invitation,
        connectionMessage.accept,
        connectionMessage.initiator,
        connectionMessage.their_role,
        connectionMessage.their_did,
        connectionMessage.their_label,
        connectionMessage.routing_state,
        connectionMessage.inbound_connection_id,
        connectionMessage.error_msg,
      )
    } else {
      console.log('State - After Response (e.g. active)')
      // (mikekebert) Only when we have an active connection can we create a new contact
      let connection = await Connections.getConnection(
        connectionMessage.connection_id,
      )

      let contact_id = ''
      if (!connection || !connection.contact_id) {
        console.log('No contact id - creating a new one')
        // (mikekebert) If we don't have a contact_id for this now active connection, then we need to generate one.
        contact_id = uuid()
        console.log('Generated contact_id: ', contact_id)

        contact = await Contacts.createContact(
          contact_id,
          connectionMessage.their_label, // label
          {}, // meta_data
        )
      } else {
        console.log('Contact id is provided')
        const existingContact = await Contacts.readBaseContact(
          connection.contact_id,
        )

        if (!existingContact) {
          await Contacts.createContact(
            connection.contact_id,
            connectionMessage.their_label, // label
            {}, // meta_data
          )
        }

        contact_id = connection.contact_id
        console.log('Provided contact_id: ', contact_id)
      }

      await Connections.updateExistingConnection(
        connectionMessage.connection_id,
        connectionMessage.state,
        connectionMessage.my_did,
        connectionMessage.alias,
        connectionMessage.request_id,
        connectionMessage.invitation_key,
        connectionMessage.invitation_mode,
        connectionMessage.invitation_url,
        connectionMessage.invitation,
        connectionMessage.accept,
        connectionMessage.initiator,
        connectionMessage.their_role,
        connectionMessage.their_did,
        connectionMessage.their_label,
        connectionMessage.routing_state,
        connectionMessage.inbound_connection_id,
        connectionMessage.error_msg,
        contact_id,
      )

      const invitation = await Invitations.getInvitationByConnectionId(
        connectionMessage.connection_id,
      )

      if (invitation) {
        //TODO: Handle verification requests with both contact_id and invitation_id. Current implementation is triggered in agentWebhook.js
        // console.log('')
        // console.log(
        //   '_____________Verification flow triggered - process pending requests_____________',
        // )
        // await Verifications.startRule(contact_id, invitation.invitation_id)

        console.log('')
        console.log(
          '_____________Credential flow triggered - process pending requests_____________',
        )
        await IssuanceRequests.processRequests(
          contact_id,
          invitation.invitation_id,
        )
      }
    }
  } catch (error) {
    console.error('Error Storing Connection Message')
    throw error
  }
}

module.exports = {
  adminMessage,
  fetchConnection,
  getContact,
  getAll,
  getContactByConnection,
}

const Invitations = require('./invitations')
