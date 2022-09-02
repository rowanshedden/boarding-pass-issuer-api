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
//     0: {name: 'nationality', value: 'what nationality'}
// 1: {name: 'document-number', value: 'Passport number'}
// 2: {name: 'given-names', value: 'my given name'}
// 3: {name: 'issuing-state', value: 'issue state'}
// 4: {name: 'document-type', value: 'document'}
// 5: {name: 'dtc', value: 'some dtc stuff'}
// 6: {name: 'chip-photo', value: 'chip photo'}
// 7: {name: 'gender', value: 'gender'}
// 8: {name: 'issue-date', value: 'issue data'}
// 9: {name: 'issuing-authority', value: 'issued authority'}
// 10: {name: 'upk', value: 'some upk stuff'}
// 11: {name: 'created-date', value: 'schema creation date'}
// 12: {name: 'expiry-date', value: 'expried when'}
// 13: {name: 'date-of-birth', value: 'date of birth'}
// 14: {name: 'family-name', value: 'name of family'}

    const passport = await Passports.updateOrCreatePassport(
      contact_id,
      data['document-number'],
      data['family-name'],
      data['given-names'],
      data['gender'],
      data['date-of-birth'],
      data['nationality'],
      data['issue-date'],
      data['expiry-date'],
      data['issuing-authority'],
      data['issuing-state'],
      data['dtc'],
      data['upk'],
      data['chip-photo'],
      data['created-date']
    )

    // const passport = await Passports.updateOrCreatePassport(
    //   contact_id,
    //   data.passport_number,
    //   data.passport_surnames,
    //   data.passport_given_names,
    //   data.passport_gender_legal,
    //   data.passport_date_of_birth,
    //   // data.passport_place_of_birth,
    //   data.passport_nationality,
    //   data.passport_date_of_issue,
    //   data.passport_date_of_expiration,
    //   // data.passport_type,
    //   // data.passport_code,
    //   data.passport_authority,
    // )
    
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
