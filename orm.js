let Settings = require('./orm/settings.js')
let Contacts = require('./orm/contacts.js')
let Demographics = require('./orm/demographics.js')
let Credentials = require('./orm/credentials.js')

const key = 'theme'
const value = {
  primary_color: '#0068B6',
  secondary_color: '#00B0F1',
  neutral_color: '#808080',
  negative_color: '#e33636',
  warning_color: '#ff8c42',
  positive_color: '#4CB944',
  text_color: '#555',
  text_light: '#fff',
  border: '#e3e3e3',
  drop_shadow: '3px 3px 3px rgba(0, 0, 0, 0.3)',
  background_primary: '#fff',
  background_secondary: '#f5f5f5',
}

const new_key = 'default_theme'
const new_value = {
  primary_color: 'red',
  secondary_color: 'green',
  neutral_color: '#808080',
  negative_color: '#e33636',
  warning_color: '#ff8c42',
  positive_color: '#4CB944',
  text_color: '#555',
  text_light: '#fff',
  border: '#e3e3e3',
  drop_shadow: '3px 3px 3px rgba(0, 0, 0, 0.3)',
  background_primary: '#fff',
  background_secondary: '#f5f5f5',
}

const run = async function() {
  // await Settings.createSetting(key, value)
  // await Settings.readSetting(key)

  // await Settings.updateSettingKey(key, new_key)
  // await Settings.readSetting(new_key)

  // await Settings.updateSetting(new_key, new_value)
  // await Settings.readSetting(new_key)

  // await Settings.createSetting(key, value)
  // await Settings.readSetting(key)

  // await Settings.readSettings()

  // await Settings.deleteSetting(key)
  // await Settings.deleteSetting(new_key)



  await Contacts.createConnection(
    '3fa85f64-5717-4562-b3fc-2c963f66afa6', // connection_id,
    'active', // state,
    'WgWxqztrNooG92RXvxSTWv', // my_did,
    'John Doe', // alias,
    '3fa85f64-5717-4562-b3fc-2c963f66afa6', // request_id,
    'H3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV', // invitation_key,
    'once', // invitation_mode,
    'http://192.168.56.101:8020/invite?c_i=eyJAdHlwZSI6Li4ufQ==', // invitation_url,
    {}, // invitation,
    'auto', // accept,
    'self', // initiator,
    'Patient', // their_role,
    'WgWxqztrNooG92RXvxSTWv', // their_did,
    'John Doe', // their_label,
    'active', // routing_state,
    '3fa85f64-5717-4562-b3fc-2c963f66afa6', // inbound_connection_id,
    'No DIDDoc provided; cannot connect to public DID', //error_msg,
  )
  await Contacts.readConnection('3fa85f64-5717-4562-b3fc-2c963f66afa6')

  await Contacts.updateConnection(
    '3fa85f64-5717-4562-b3fc-2c963f66afa6', // connection_id,
    'active', // state,
    'WgWxqztrNooG92RXvxSTWv', // my_did,
    'John J. Doe', // alias,
    '3fa85f64-5717-4562-b3fc-2c963f66afa6', // request_id,
    'H3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV', // invitation_key,
    'once', // invitation_mode,
    'http://192.168.56.101:8020/invite?c_i=eyJAdHlwZSI6Li4ufQ==', // invitation_url,
    {}, // invitation,
    'auto', // accept,
    'self', // initiator,
    'Patient', // their_role,
    'WgWxqztrNooG92RXvxSTWv', // their_did,
    'John J. Doe', // their_label,
    'active', // routing_state,
    '3fa85f64-5717-4562-b3fc-2c963f66afa6', // inbound_connection_id,
    'Updated error message just for fun', //error_msg,
  )
  await Contacts.readConnection('3fa85f64-5717-4562-b3fc-2c963f66afa6')

  await Contacts.createConnection(
    '3fa85f64-5717-4562-b3fc-2c963f66b0b7', // connection_id,
    'active', // state,
    'WgWxqztrNooG92RXvxSTWv', // my_did,
    'Jill Doe', // alias,
    '3fa85f64-5717-4562-b3fc-2c963f66afa6', // request_id,
    'H3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV', // invitation_key,
    'once', // invitation_mode,
    'http://192.168.56.101:8020/invite?c_i=eyJAdHlwZSI6Li4ufQ==', // invitation_url,
    {}, // invitation,
    'auto', // accept,
    'self', // initiator,
    'Patient', // their_role,
    'WgWxqztrNooG92RXvxSTWv', // their_did,
    'Jill Doe', // their_label,
    'active', // routing_state,
    '3fa85f64-5717-4562-b3fc-2c963f66afa6', // inbound_connection_id,
    'Random human fault; please reboot the system', //error_msg,
  )
  await Contacts.readConnections()



  const contact = await Contacts.createContact(
    'John Doe', // label
    {
      first_name: 'John',
      last_name: 'Doe',
      mud: '1234098765',
    }, // meta_data
  )
  await Contacts.readContact(contact.contact_id)

  await Contacts.updateContact(
    contact.contact_id,
    'John J. Doe', // label
    {
      first_name: 'John J.',
      last_name: 'Doe',
      mud: '1234567890',
    }, // meta_data
  )
  await Contacts.readContact(contact.contact_id)

  const new_contact = await Contacts.createContact(
    'Jane Doe', // label
    {
      first_name: 'Jane',
      last_name: 'Doe',
      mud: '1234098765',
    }, // meta_data
  )
  await Contacts.readContact(new_contact.contact_id)

  await Contacts.linkContactAndConnection(contact.contact_id, '3fa85f64-5717-4562-b3fc-2c963f66afa6')

  await Contacts.readContacts()
  await Contacts.readConnections()



  const demographic = await Demographics.createDemographic (
    contact.contact_id, // contact_id
    '123556789', // mpid
    'John', // first_name
    'Jacob', // middle_name
    'Jingle-heimer Schmidt', // last_name
    '1962-10-31', // date_of_birth
    'male', //gender
    '+1 208-710-0000', // phone
    {
      address_1: '1234 Lane St.',
      address_2: '',
      city: 'Rexburg',
      state: 'Idaho',
      zip_code: '83440',
      country: 'United States',
    }, // address
  )
  await Demographics.readDemographic(contact.contact_id)
  
  await Demographics.updateDemographic (
    contact.contact_id, // contact_id
    '123556789', // mpid
    'John', // first_name
    'Jacob', // middle_name
    'Schmidt', // last_name
    '1962-10-31', // date_of_birth
    'male', //gender
    '+1 208-710-1234', // phone
    {
      address_1: '4321 Lane St.',
      address_2: '',
      city: 'Rexburg',
      state: 'Idaho',
      zip_code: '83440',
      country: 'United States',
    }, // address
  )
  await Demographics.readDemographic(contact.contact_id)

  await Demographics.readContactDemographic(contact.contact_id)

  // await Demographics.createDemographic (
  //   new_contact.contact_id, // contact_id
  //   '123556789', // mpid
  //   'John', // first_name
  //   'Definitely', // middle_name
  //   'Doe', // last_name
  //   '1962-10-30', // date_of_birth
  //   'male', //gender
  //   '+1 208-710-1337', // phone
  //   {
  //     address_1: '4322 Lane St.',
  //     address_2: '',
  //     city: 'Rexburg',
  //     state: 'Idaho',
  //     zip_code: '83440',
  //     country: 'United States',
  //   }, // address
  // )
  await Demographics.readDemographics()

  await Demographics.readContactsDemographics()

  await Demographics.deleteDemographic(contact.contact_id)
  await Demographics.deleteDemographic(new_contact.contact_id)
  await Contacts.deleteConnection('3fa85f64-5717-4562-b3fc-2c963f66afa6')
  await Contacts.deleteConnection('3fa85f64-5717-4562-b3fc-2c963f66b0b7')
  await Contacts.deleteContact(contact.contact_id)
  await Contacts.deleteContact(new_contact.contact_id)



  await Credentials.createCredential(
    '2fa85f64-5717-4562-b3fc-2c963f66b0b7', // credential_id,
    {}, // credential
    {}, // raw_credential
    'lasjadsfasdfe', // revocation_id

    'asfasfsadfsdfsa', // connection_id
    'active', // state
    'issuer', // role
    'self', // initiator

    'asdfasdfsafsdf', // thread_id
    'asdfffadsfsdfs', // parent_thread_id
    'asdfasdfsdfdsf', //credential_exchange_id

    '2fa85f64-5717-4562-b3fc-2c963f66b0b7:schema_name:1.0', // schema_id
    '2fa85f64-5717-4562-b3fc-2c963f66b0b7:credential_definition:1.0', //credential_definition_id
    '2342342343', // revoc_reg_id

    {}, // credential_proposal_dict
    {}, // credential_offer
    {}, // credential_offer_dict
    {}, // credential_request
    {}, // credential_request_metadata

    true, // auto_issue
    true, // auto_offer,
    true, // auto_remove

    'Sample error message goes here', // error_msg
    true, // trace
  )
  await Credentials.readCredential('2fa85f64-5717-4562-b3fc-2c963f66b0b7')

  await Credentials.updateCredential(
    '2fa85f64-5717-4562-b3fc-2c963f66b0b7', // credential_id,
    {}, // credential
    {}, // raw_credential
    'fffffffffffffff', // revocation_id

    'fffffffffffffff', // connection_id
    'active', // state
    'issuer', // role
    'self', // initiator

    'asdfasdfsafsdf', // thread_id
    'asdfffadsfsdfs', // parent_thread_id
    'ffffffffffffff', //credential_exchange_id

    '2fa85f64-5717-4562-b3fc-2c963f66b0b7:schema_name:1.0', // schema_id
    '2fa85f64-5717-4562-b3fc-2c963f66b0b7:credential_definition:1.0', //credential_definition_id
    '2342342343', // revoc_reg_id

    {}, // credential_proposal_dict
    {}, // credential_offer
    {}, // credential_offer_dict
    {}, // credential_request
    {}, // credential_request_metadata

    false, // auto_issue
    false, // auto_offer,
    false, // auto_remove

    'Sample error message goes here', // error_msg
    true, // trace
  )
  await Credentials.readCredential('2fa85f64-5717-4562-b3fc-2c963f66b0b7')

  await Credentials.createCredential(
    '2fa85f64-5717-4562-b3fc-2c963f66b0a9', // credential_id,
    {}, // credential
    {}, // raw_credential
    'lasjadsfasdfe', // revocation_id

    'asfasfsadfsdfsa', // connection_id
    'active', // state
    'issuer', // role
    'self', // initiator

    'asdfasdfsafsdf', // thread_id
    'asdfffadsfsdfs', // parent_thread_id
    'asdfasdfsdfdsf', //credential_exchange_id

    '2fa85f64-5717-4562-b3fc-2c963f66b0b7:schema_name:1.0', // schema_id
    '2fa85f64-5717-4562-b3fc-2c963f66b0b7:credential_definition:1.0', //credential_definition_id
    '2342342343', // revoc_reg_id

    {}, // credential_proposal_dict
    {}, // credential_offer
    {}, // credential_offer_dict
    {}, // credential_request
    {}, // credential_request_metadata

    true, // auto_issue
    true, // auto_offer,
    true, // auto_remove

    'Sample error message goes here', // error_msg
    true, // trace
  )
  await Credentials.readCredential('2fa85f64-5717-4562-b3fc-2c963f66b0a9')

  await Credentials.readCredentials()
  
  await Credentials.deleteCredential('2fa85f64-5717-4562-b3fc-2c963f66b0b7')
  await Credentials.deleteCredential('2fa85f64-5717-4562-b3fc-2c963f66b0a9')
}

run()