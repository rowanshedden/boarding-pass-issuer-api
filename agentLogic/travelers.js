const Websockets = require('../websockets.js')

let ContactsCompiled = require('../orm/contactsCompiled.js')
let Travelers = require('../orm/travelers.js')

const updateOrCreateTraveler = async function (
  contact_id,
  traveler_email,
  traveler_phone,
  traveler_country,
  traveler_country_of_origin,
  arrival_airline,
  arrival_flight_number,
  arrival_date,
  arrival_destination_port_code,
  arrival_destination_country_code,
  departure_airline,
  departure_flight_number,
  departure_date,
  departure_destination_port_code,
  departure_destination_country_code,
  verification_status,
) {
  const arrivalDate = new Date(arrival_date).getTime()
  const departureDate = new Date(departure_date).getTime()

  try {
    await Travelers.createOrUpdateTraveler(
      contact_id,
      traveler_email,
      traveler_phone,
      traveler_country,
      traveler_country_of_origin,
      arrival_airline,
      arrival_flight_number,
      arrivalDate,
      arrival_destination_port_code,
      arrival_destination_country_code,
      departure_airline,
      departure_flight_number,
      departureDate,
      departure_destination_port_code,
      departure_destination_country_code,
      verification_status,
    )

    const contact = await ContactsCompiled.readContact(contact_id, [
      'Traveler',
      'Passport',
    ])

    Websockets.sendMessageToAll('CONTACTS', 'CONTACTS', {contacts: [contact]})

    return contact
  } catch (error) {
    console.error('Error Fetching Contacts')
    throw error
  }
}

const updateVerificationStatus = async function (
  contact_id,
  verification_status,
) {
  try {
    const timestamp = Date.now()

    await Travelers.updateTravelerVerification(contact_id, verification_status)

    console.log('Verification status update success.')
  } catch (error) {
    console.error('Verification status update failed: ', error)
  }
}

const updateProofStatus = async function (contact_id, proof_status) {
  try {
    const timestamp = Date.now()

    await Travelers.updateProofStatus(contact_id, proof_status)

    console.log('Proof status update success.')
  } catch (error) {
    console.error('Proof status update failed: ', error)
  }
}

module.exports = {
  updateOrCreateTraveler,
  updateVerificationStatus,
  updateProofStatus,
}
