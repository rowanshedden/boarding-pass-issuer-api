const AdminAPI = require('../adminAPI')
const Websockets = require('../websockets.js')

let Contacts = require('../orm/contacts.js')
let Demographics = require('../orm/demographics.js')

//Perform Agent Business Logic

//Fetch an existing connection
const fetchConnection = async (connectionID) => {
  try {
    //(JamesKEbert)TODO:Change to use Controller DB versus Admin API Call
    const connection = await AdminAPI.Connections.fetchConnection(connectionID)

    return connection
  } catch (error) {
    console.error('Error Fetching Connection')
    throw error
  }
}

const updateOrCreateDemographic = async (contactID, firstName, middleName, lastName, dateOfBirth, gender, mpid, address, phone) => {
  try {
    const contact = await Demographics.readContactDemographic(
      contactID,
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      gender,
      mpid,
      address,
      phone
    );
    
    console.log("Contact:", contact)

    Websockets.sendMessageToAll('CONTACTS', 'CONTACTS', {contacts:[contact]})

  } catch (error) {
    console.error('Error Fetching Contacts')
    throw error
  }
}

const getContact = async (contactID, additionalTables) => {
  try {
    let contacts = [];
    if(additionalTables.includes("Demographic")){
      contacts = await Demographics.readContactDemographic(contactID)
    } else{
      contacts = await Contacts.readContact(contactID)
    }
    console.log("Contact:", contact)

    return contact
  } catch (error) {
    console.error('Error Fetching Contact')
    throw error
  }
}

const getAll = async (additionalTables) => {
  try {
    let contacts = [];
    if(additionalTables.includes("Demographic")){
      contacts = await Demographics.readContactsDemographics()
    } else{
      contacts = await Contacts.readContacts()
    }

    console.log("Contacts:", contacts)

    return contacts
  } catch (error) {
    console.error('Error Fetching Contacts')
    throw error
  }
}

const adminMessage = async (connectionMessage) => {
  try {
    console.log("Received new Admin Webhook Message", connectionMessage);
    
    if(connectionMessage.state === 'invitation'){
      console.log("State - Invitation");

      await Contacts.createOrUpdateConnection(
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

      return;
    }


    var contact;

    if (connectionMessage.state === 'request'){
      console.log("State - Request");
      console.log("Creating Contact")

      contact = await Contacts.createContact(
        connectionMessage.their_label, // label
        {}, // meta_data
      )

      await Contacts.updateConnection(
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

      await Contacts.linkContactAndConnection(contact.contact_id, connectionMessage.connection_id)
      Websockets.sendMessageToAll('INVITATIONS', 'SINGLE_USE_USED', {connection_id:connectionMessage.connection_id})
    }
    else{
      console.log("State - Response or later");
      await Contacts.updateConnection(
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
    }

    //contact = await Contacts.readContactByConnection(connectionMessage.connection_id)
    contact = await Demographics.readContactByConnection(connectionMessage.connection_id)

    Websockets.sendMessageToAll('CONTACTS', 'CONTACTS', {contacts:[contact]})


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
  updateOrCreateDemographic
}
