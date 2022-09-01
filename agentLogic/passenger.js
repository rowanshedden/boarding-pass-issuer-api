const Travelers = require('./travelers')
const Passports = require('./passports')

const addTravelerAndPassport = async function (contact_id, data) {
  try {
    console.log('Creating traveler')
    // (edersonar) Create Traveler
    const traveler = await Travelers.updateOrCreateTraveler(
      contact_id,
      data.traveler_email,
      data.traveler_phone,
      data.traveler_country,
      data.traveler_country_of_origin,
      data.arrival_airline,
      data.arrival_flight_number,
      data.arrival_date,
      data.arrival_destination_port_code,
      data.arrival_destination_country_code,
      data.departure_airline,
      data.departure_flight_number,
      data.departure_date,
      data.departure_destination_port_code,
      data.departure_destination_country_code,
      null,
    )
    console.log('Creating passport')
    // (eldersonar) Create passport
    const passport = await Passports.updateOrCreatePassport(
      contact_id,
      data.passport_number,
      data.passport_surnames,
      data.passport_given_names,
      data.passport_gender_legal,
      data.passport_date_of_birth,
      // data.passport_place_of_birth,
      data.passport_nationality,
      data.passport_date_of_issue,
      data.passport_date_of_expiration,
      // data.passport_type,
      // data.passport_code,
      data.passport_authority,
    )
    console.log('Successfully added traveler and passport')

    if (traveler && passport) {
      return true
    }
  } catch (error) {
    console.error('Error while adding traveler and passport: ', error)
  }
}

module.exports = {
  addTravelerAndPassport,
}
