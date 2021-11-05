const Websockets = require('../websockets.js')

let ContactsCompiled = require('../orm/contactsCompiled.js')
let Passports = require('../orm/passports.js')

const updateOrCreatePassport = async function (
  contact_id,
  passport_number,
  passport_surnames,
  passport_given_names,
  passport_gender_legal,
  passport_date_of_birth,
  passport_place_of_birth,
  passport_nationality,
  passport_date_of_issue,
  passport_date_of_expiration,
  passport_type,
  passport_code,
  passport_authority,
) {
  const dateOfIssue = new Date(passport_date_of_issue).getTime()
  const datOfExpiration = new Date(passport_date_of_expiration).getTime()
  const date_of_birth = new Date(passport_date_of_birth).getTime()

  try {
    const passport = await Passports.createOrUpdatePassport(
      contact_id,
      passport_number,
      passport_surnames,
      passport_given_names,
      passport_gender_legal,
      date_of_birth,
      passport_place_of_birth,
      passport_nationality,
      dateOfIssue,
      datOfExpiration,
      passport_type,
      passport_code,
      passport_authority,
    )

    const contact = await ContactsCompiled.readContact(contact_id, [
      'Traveler',
      'Passport',
    ])

    Websockets.sendMessageToAll('CONTACTS', 'CONTACTS', {contacts: [contact]})

    return passport
  } catch (error) {
    console.error('Error Fetching Contacts')
    throw error
  }
}

module.exports = {
  updateOrCreatePassport,
}
