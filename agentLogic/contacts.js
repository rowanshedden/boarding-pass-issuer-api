const AdminAPI = require('../adminAPI')
const Websockets = require('../websockets.js')

let Connections = require('../orm/connections.js')
let Contacts = require('../orm/contacts.js')
let ContactsCompiled = require('../orm/contactsCompiled.js')

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

const getAll = async (additionalTables) => {
  try {
    const contacts = await ContactsCompiled.readContacts(additionalTables)

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

      await Connections.createOrUpdateConnection(
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

    var contact

    if (
      connectionMessage.state === 'request' ||
      connectionMessage.state === 'response'
    ) {
      console.log('State - Request or Response')

      await Connections.updateConnection(
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
      let connection = await Connections.readConnection(
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
        console.log('Reusing existing contact id')
        // (mikekebert) If we have a contact_id already, we should use it
        contact_id = connection.contact_id
        console.log('Provided contact_id: ', contact_id)
      }

      await Connections.updateConnection(
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

      contact = await ContactsCompiled.readContact(contact_id, [
        'Traveler',
        'Passport',
      ])

      //(AmmonBurgi) Send contact/connection only on active connection state
      Websockets.sendMessageToAll('CONTACTS', 'CONTACTS', {contacts: [contact]})
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
