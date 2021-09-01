const {DateTime} = require('luxon')
const {v4: uuid} = require('uuid')

const ControllerError = require('../errors.js')

const AdminAPI = require('../adminAPI')
const Credentials = require('./credentials.js')
const {getOrganization} = require('./settings.js')
const Websockets = require('../websockets.js')

const requestPresentation = async (connectionID, type) => {
  console.log(`Requesting Presentation from Connection: ${connectionID}`)

  let result = null

  switch (type) {
    case 'Vaccine':
      result = AdminAPI.Presentations.requestPresentation(
        connectionID,
        [
          'patient_surnames',
          'patient_given_names',
          'patient_date_of_birth',
          'patient_gender_legal',
          'patient_country',
          'patient_email',
          'vaccine_administration_date',
          'vaccine_series_complete',
        ],
        'RuuJwd3JMffNwZ43DcJKN1:2:Vaccination:1.4',
        'Requesting Presentation',
        false,
      )

      break
    case 'Result':
      result = AdminAPI.Presentations.requestPresentation(
        connectionID,
        [
          'patient_surnames',
          'patient_given_names',
          'patient_date_of_birth',
          'patient_gender_legal',
          'patient_country',
          'patient_email',
          'lab_result',
          'lab_specimen_collected_date',
        ],
        'RuuJwd3JMffNwZ43DcJKN1:2:Lab_Result:1.4',
        'Requesting Presentation',
        false,
      )

      break
    case 'Exemption':
      result = AdminAPI.Presentations.requestPresentation(
        connectionID,
        [
          'patient_surnames',
          'patient_given_names',
          'patient_date_of_birth',
          'patient_gender_legal',
          'patient_country',
          'patient_email',
          'exemption_expiration_date',
        ],
        'RuuJwd3JMffNwZ43DcJKN1:2:Vaccine_Exemption:1.4',
        'Requesting Presentation',
        false,
      )

      break
    default:
      break
  }
}
const adminMessage = async (message) => {
  console.log('Received Presentations Message', message)

  if (message.state === 'verified') {
    let values = ''

    // (mikekebert) Check the data format to see if the presentation requires the referrant pattern
    if (message.presentation.requested_proof.revealed_attr_groups) {
      values =
        message.presentation.requested_proof.revealed_attr_groups[
          Object.keys(
            message.presentation.requested_proof.revealed_attr_groups,
          )[0] // Get first group available
        ].values // TODO: this needs to be a for-in loop or similar later
    } else {
      values = message.presentation.requested_proof.revealed_attrs
    }

    const issuerName = await getOrganization()
    let verifiedAttributes = null
    if (values) {
      let attributes = [
        {
          name: 'traveler_surnames',
          value: values.patient_surnames.raw || '',
        },
        {
          name: 'traveler_given_names',
          value: values.patient_given_names.raw || '',
        },
        {
          name: 'traveler_date_of_birth',
          value: values.patient_date_of_birth.raw || '',
        },
        {
          name: 'traveler_gender_legal',
          value: values.patient_gender_legal.raw || '',
        },
        {
          name: 'traveler_country',
          value: values.patient_country.raw || '',
        },
        {
          name: 'traveler_origin_country',
          value: '',
        },
        {
          name: 'traveler_email',
          value: values.patient_email.raw || '',
        },
        {
          name: 'trusted_traveler_id',
          value: uuid(),
        },
        {
          name: 'trusted_traveler_issue_date_time',
          value: Math.round(DateTime.fromISO(new Date()).ts / 1000).toString(),
        },
        {
          name: 'trusted_traveler_expiration_date_time',
          value: Math.round(
            DateTime.local().plus({days: 30}).ts / 1000,
          ).toString(),
        },
        {
          name: 'governance_applied',
          value: '',
        },
        {
          name: 'credential_issuer_name',
          value: issuerName.dataValues.value.organizationName || '',
        },
        {
          name: 'credential_issue_date',
          value: Math.round(DateTime.fromISO(new Date()).ts / 1000).toString(),
        },
      ]

      if (values.lab_result && values.lab_specimen_collected_date) {
        console.log(values.lab_specimen_collected_date.raw * 1000)
        console.log(DateTime.local().plus({days: -3}).ts)
        if (
          ((values.lab_result.raw === 'Negative' ||
            values.lab_result.raw === 'Weakly positive') &&
            values.lab_specimen_collected_date.raw * 1000 >
              DateTime.local().plus({days: -3}).ts) ||
          (values.lab_result.raw === 'Positive' &&
            values.lab_specimen_collected_date.raw * 1000 <
              DateTime.local().plus({days: -28}).ts)
        ) {
          verifiedAttributes = attributes
        }
      } else if (
        values.vaccine_series_complete &&
        values.vaccine_administration_date
      ) {
        if (
          values.vaccine_series_complete.raw === 'true' &&
          values.vaccine_administration_date.raw * 1000 <
            DateTime.local().plus({days: -14}).ts
        ) {
          verifiedAttributes = attributes
        }
      } else if (values.exemption_expiration_date) {
        if (values.exemption_expiration_date.raw * 1000 > DateTime.local().ts) {
          verifiedAttributes = attributes
        }
      } else {
      }
    }
    console.log(verifiedAttributes)
    if (verifiedAttributes !== null) {
      let newCredential = {
        connectionID: message.connection_id,
        schemaID: 'RuuJwd3JMffNwZ43DcJKN1:2:Trusted_Traveler:1.4',
        schemaVersion: '1.4',
        schemaName: 'Trusted_Traveler',
        schemaIssuerDID: 'RuuJwd3JMffNwZ43DcJKN1',
        comment: '',
        attributes: verifiedAttributes,
      }

      // (mikekebert) Request issuance of the trusted_traveler credential
      await Credentials.autoIssueCredential(
        newCredential.connectionID,
        undefined,
        undefined,
        newCredential.schemaID,
        newCredential.schemaVersion,
        newCredential.schemaName,
        newCredential.schemaIssuerDID,
        newCredential.comment,
        newCredential.attributes,
      )
    } else {
      // (mikekebert) Send a basic message saying the verification was rejected because of business logic
      console.log('Presentation rejected: 2019-nCoV Detected')
      await AdminAPI.Connections.sendBasicMessage(message.connection_id, {
        content: 'INVALID_PROOF',
      })
    }
  } else if (message.state === null) {
    // (mikekebert) Send a basic message saying the verification failed for technical reasons
    console.log('Validation failed for technical reasons')
    await AdminAPI.Connections.sendBasicMessage(message.connection_id, {
      content: 'UNVERIFIED',
    })
  } else {
  }
}

module.exports = {
  adminMessage,
  requestPresentation,
}
