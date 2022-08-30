const axios = require('axios')
const {DateTime} = require('luxon')

const ControllerError = require('../errors.js')

const AdminAPI = require('../adminAPI')
const Websockets = require('../websockets.js')
const CredDefs = require('./credDefs.js')
const Contacts = require('./contacts.js')
const DIDs = require('./dids.js')
const Schemas = require('./schemas.js')

const ContactsCompiled = require('../orm/contactsCompiled')
const Credentials = require('../orm/credentials.js')

// Perform Agent Business Logic

const getCredential = async (credential_exchange_id) => {
  try {
    const credentialRecord = await Credentials.readCredential(
      credential_exchange_id,
    )

    console.log('Credential Record:', credentialRecord)

    return credentialRecord
  } catch (error) {
    console.error('Error Fetching Credential Record')
    throw error
  }
}

const getAll = async () => {
  try {
    const credentialRecords = await Credentials.readCredentials()

    console.log('Got all Credential Records')

    return credentialRecords
  } catch (error) {
    console.error('Error Fetching Credential Records')
    throw error
  }
}

const adminMessage = async (credentialIssuanceMessage) => {
  try {
    console.log('Received new Admin Webhook Message', credentialIssuanceMessage)

    console.log(`State - ${credentialIssuanceMessage.state}`)
    var credentialRecord
    if (
      credentialIssuanceMessage.state === 'proposal_received' ||
      credentialIssuanceMessage.state === 'proposal_sent' ||
      credentialIssuanceMessage.state === 'offer_received' ||
      credentialIssuanceMessage.state === 'offer_sent'
    ) {
      credentialRecord = await Credentials.createCredential(
        credentialIssuanceMessage.credential_exchange_id,
        credentialIssuanceMessage.credential_id,
        credentialIssuanceMessage.credential,
        credentialIssuanceMessage.raw_credential,
        credentialIssuanceMessage.revocation_id,
        credentialIssuanceMessage.connection_id,
        credentialIssuanceMessage.state,
        credentialIssuanceMessage.role,
        credentialIssuanceMessage.initiator,
        credentialIssuanceMessage.thread_id,
        credentialIssuanceMessage.parent_thread_id,
        credentialIssuanceMessage.schema_id,
        credentialIssuanceMessage.credential_definition_id,
        credentialIssuanceMessage.revoc_reg_id,
        credentialIssuanceMessage.credential_proposal_dict,
        credentialIssuanceMessage.credential_offer,
        credentialIssuanceMessage.credential_offer_dict,
        credentialIssuanceMessage.credential_request,
        credentialIssuanceMessage.credential_request_metadata,
        credentialIssuanceMessage.auto_issue,
        credentialIssuanceMessage.auto_offer,
        credentialIssuanceMessage.auto_remove,
        credentialIssuanceMessage.error_msg,
        credentialIssuanceMessage.trace,
        credentialIssuanceMessage.created_at,
        credentialIssuanceMessage.updated_at,
      )
    } else {
      credentialRecord = await Credentials.updateCredential(
        credentialIssuanceMessage.credential_exchange_id,
        credentialIssuanceMessage.credential_id,
        credentialIssuanceMessage.credential,
        credentialIssuanceMessage.raw_credential,
        credentialIssuanceMessage.revocation_id,
        credentialIssuanceMessage.connection_id,
        credentialIssuanceMessage.state,
        credentialIssuanceMessage.role,
        credentialIssuanceMessage.initiator,
        credentialIssuanceMessage.thread_id,
        credentialIssuanceMessage.parent_thread_id,
        credentialIssuanceMessage.schema_id,
        credentialIssuanceMessage.credential_definition_id,
        credentialIssuanceMessage.revoc_reg_id,
        credentialIssuanceMessage.credential_proposal_dict,
        credentialIssuanceMessage.credential_offer,
        credentialIssuanceMessage.credential_offer_dict,
        credentialIssuanceMessage.credential_request,
        credentialIssuanceMessage.credential_request_metadata,
        credentialIssuanceMessage.auto_issue,
        credentialIssuanceMessage.auto_offer,
        credentialIssuanceMessage.auto_remove,
        credentialIssuanceMessage.error_msg,
        credentialIssuanceMessage.trace,
        credentialIssuanceMessage.created_at,
        credentialIssuanceMessage.updated_at,
      )
    }
    console.log(credentialIssuanceMessage.state)
    if (credentialIssuanceMessage.state === 'credential_acked') {
      if (
        credentialIssuanceMessage.schema_id ===
        process.env.SCHEMA_TRUSTED_TRAVELER
      ) {
        let SITAHubTraveler = {}

        // (mikekebert) Find the contact
        const contact = await ContactsCompiled.readContactByConnection(
          credentialIssuanceMessage.connection_id,
          ['Traveler', 'Passport'],
        )

        console.log(contact)
        const passport = contact.Passport.dataValues
        const traveler = contact.Traveler.dataValues

        if (credentialIssuanceMessage.connection_id != '') {
          SITAHubTraveler = {
            xid: credentialIssuanceMessage.connection_id,
            travellerDetails: {
              dateOfBirth: DateTime.fromJSDate(
                new Date(passport.passport_date_of_birth),
              ).toFormat('yyyy-MM-dd'),
              familyName: passport.passport_surnames,
              givenNames: passport.passport_given_names,
              nationality: passport.passport_code,
              sex: passport.passport_gender_legal,
              travelDocumentDetails: [
                {
                  issuingState: passport.passport_code,
                  number: passport.passport_number,
                  type: passport.passport_type,
                },
              ],
            },
            travelItinerary: {
              carrierCode: '',
              carrierType: 'A',
              pnrNumber: '',
              routeDetails: [
                {
                  arrival: {
                    countryCode: traveler.arrival_destination_country_code,
                    dateTime: traveler.arrival_date,
                    portCode: traveler.arrival_destination_port_code,
                  },
                  departure: {
                    countryCode: traveler.departure_destination_country_code,
                    dateTime: traveler.departure_date,
                    portCode: traveler.departure_destination_port_code,
                  },
                },
              ],
              serviceNumber: '',
            },
          }
        }

        if (SITAHubTraveler != {}) {
          console.log('Send data to SITA')
          // (eldersonar) Posting to the SITA HEALTH HUB database
          await axios({
            method: 'POST',
            url: process.env.SITA_API,
            headers: {'x-apikey': process.env.SITA_APIKEY},
            data: SITAHubTraveler,
          })
            .then((response) => {
              console.log('Successfully sent data to SITA')
            })
            .catch(function (error) {
              // (eldersonar) Wait for 30 seconds and try again
              setTimeout(async () => {
                const secondResponse = await axios({
                  method: 'POST',
                  url: process.env.SITA_API,
                  headers: {'x-apikey': process.env.SITA_APIKEY},
                  data: SITAHubTraveler,
                })
                  .then((response2) => {
                    console.log('Successfully sent data to SITA')
                  })
                  .catch(function (error) {
                    console.log('Error sending data to SITA')
                  })
              }, 30000)
            })
        }
      }
    }

    if (credentialIssuanceMessage.role === 'issuer') {
      Websockets.sendMessageToAll('CREDENTIALS', 'CREDENTIALS', {
        credential_records: [credentialRecord],
      })
    }
  } catch (error) {
    console.error('Error Storing Connection Message')
    throw error
  }
}

// Auto Credential Issuance
const autoIssueCredential = async (
  connectionID,
  issuerDID,
  credDefID,
  schemaID,
  schemaVersion,
  schemaName,
  schemaIssuerDID,
  comment = '',
  attributes = [],
) => {
  try {
    // Perform Validations

    // Validate Connection
    const connection = await AdminAPI.Connections.fetchConnection(connectionID)

    if (!connection) {
      console.error('Connection Not Present')
      throw new ControllerError(2, 'Connection Not Present')
    } else if (connection.state !== 'active') {
      console.error('Connection Not Ready to Receive Credentials')
      throw new ControllerError(3, 'Connection Not Active')
    }

    // Validate Public DID
    const publicDID = await DIDs.fetchPublicDID()

    if (!publicDID) {
      console.error('Public DID Not Set')
      throw new ControllerError(4, 'Public DID Not Set')
    }

    // Validate Credential Definition
    const credDefIDs = await CredDefs.createdCredDefIDs(
      credDefID,
      issuerDID,
      schemaID,
      schemaIssuerDID,
      schemaName,
      schemaVersion,
    )

    if (credDefIDs.length <= 0) {
      console.error('Credential Definition ID Invalid')
      throw new ControllerError(5, 'Credential Definition ID Invalid')
    }

    // Fetch Credential Definition to check the schema utilized
    const credDef = await CredDefs.fetchCredDef(credDefIDs[0])

    // Validate Schema
    const schema = await Schemas.fetchSchema(schemaID)

    if (!schema) {
      console.error('Schema ID Invalid')
      throw new ControllerError(6, 'Schema ID Invalid')
    }
    // Check to see if the schema used in the cred def is the specified schema
    else if (schema.seqNo != credDef.schemaId) {
      console.error(
        "Credential Definition's Schema Doesn't Match The Supplied Schema",
      )
      throw new ControllerError(
        7,
        "Credential Definition's Schema Doesn't Match The Supplied Schema",
      )
    }

    // Validate the Attributes
    // Ensure all attributes based on the schema have been assigned a value
    for (var i = 0; i < schema.attrNames.length; i++) {
      const accounted = attributes.some((attribute) => {
        if (attribute.name === schema.attrNames[i]) {
          return true
        } else {
          return false
        }
      })

      if (!accounted) {
        console.error('Attribute(s) Not Assigned Values')
        throw new ControllerError(8, 'Attribute(s) Not Assigned Values')
      }
    }

    const response = await AdminAPI.Credentials.autoIssueCred(
      connectionID,
      issuerDID,
      credDefIDs[0],
      schemaID,
      schemaVersion,
      schemaName,
      schemaIssuerDID,
      comment,
      attributes,
      false,
      false,
    )
  } catch (error) {
    console.error('Error Issuing Credential')
    throw error
  }
}

module.exports = {
  adminMessage,
  autoIssueCredential,
  getCredential,
  getAll,
}
