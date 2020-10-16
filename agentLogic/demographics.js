const Websockets = require('../websockets.js')

let Connections = require('../orm/connections.js')
let Contacts = require('../orm/contacts.js')
let ContactsCompiled = require('../orm/contactsCompiled.js')
let Demographics = require('../orm/demographics.js')

const updateOrCreateDemographic = async function (
		contactID, 
		mpid,  
		firstName, 
		middleName, 
		lastName, 
		dateOfBirth, 
		gender, 
		phone,
		address
	)  {
  try {
    await Demographics.createOrUpdateDemographic(
      contactID,
      mpid,
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      address
    );

    const contact = await ContactsCompiled.readContact(contactID, ['Demographic'])

    console.log("Contact:", contact)

    Websockets.sendMessageToAll('CONTACTS', 'CONTACTS', {contacts:[contact]})

  } catch (error) {
    console.error('Error Fetching Contacts')
    throw error
  }
}

module.exports = {
  updateOrCreateDemographic
}