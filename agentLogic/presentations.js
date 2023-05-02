const AdminAPI = require('../adminAPI')
const Websockets = require('../websockets')
const Presentations = require('../orm/presentations')

const requestSchemaPresentation = async (
  connection_id,
  schema_attributes,
  schema_id,
) => {
  console.log(`Requesting Presentation from Connection: ${connection_id}`)

  return await AdminAPI.Presentations.requestPresentationBySchemaId(
    connection_id,
    schema_attributes,
    schema_id,
    'Requesting Presentation',
    false,
  )
}

const adminMessage = async (message) => {
  console.log('Received Presentations Message', message)

  if (message.state === 'verified') {
    let attributes = ''

    // (mikekebert) Check the data format to see if the presentation requires the referrant pattern
    if (message.presentation.requested_proof.revealed_attr_groups) {
      attributes =
        message.presentation.requested_proof.revealed_attr_groups[
          Object.keys(
            message.presentation.requested_proof.revealed_attr_groups,
          )[0] // Get first group available
        ].values // TODO: this needs to be a for-in loop or similar later
    } else {
      attributes = message.presentation.requested_proof.revealed_attrs
    }

    console.log('Verified Attributes: ', attributes)
  } else if (message.state === null) {
    // (mikekebert) Send a basic message saying the verification failed for technical reasons
    console.log('Validation failed for technical reasons')
    await AdminAPI.Connections.sendBasicMessage(message.connection_id, {
      content: 'UNVERIFIED',
    })
  } else {
  }
}

const createPresentationReports = async (presentation) => {
  try {
    const contact = await Contacts.getContactByConnection(
      presentation.connection_id,
    )

    const presentationReport = await Presentations.createPresentationReports(
      presentation.presentation_exchange_id,
      presentation.trace,
      presentation.connection_id,
      presentation.role,
      presentation.created_at,
      presentation.updated_at,
      JSON.stringify(presentation.presentation_request_dict),
      presentation.initiator,
      JSON.stringify(presentation.presentation_request),
      presentation.state,
      presentation.thread_id,
      presentation.auto_present,
      JSON.stringify(presentation.presentation),
      contact ? contact.label : '',
      contact ? contact.contact_id : '',
    )

    // Broadcast the message to all connections
    Websockets.sendMessageToAll('PRESENTATIONS', 'PRESENTATION_REPORTS', {
      presentation_reports: [presentationReport],
    })
  } catch (error) {
    console.log('Error creating presentation reports:')
    throw error
  }
}

const updatePresentationReports = async (presentation) => {
  try {
    let requestedPresentation = presentation.presentation

    // (AmmonBurgi) If our environment variable is equal to false, assign presentation to undefined so we don't store PHI attributes. Assigning it to undefined will prevent UI from breaking.
    if (process.env.STORE_PRESENTATION_ATTRIBUTES === 'false') {
      requestedPresentation = undefined
    }

    const contact = await Contacts.getContactByConnection(
      presentation.connection_id,
    )

    const presentationReport = await Presentations.updatePresentationReports(
      presentation.presentation_exchange_id,
      presentation.trace,
      presentation.connection_id,
      presentation.role,
      presentation.created_at,
      presentation.updated_at,
      JSON.stringify(presentation.presentation_request_dict),
      presentation.initiator,
      JSON.stringify(presentation.presentation_request),
      presentation.state,
      presentation.thread_id,
      presentation.auto_present,
      JSON.stringify(requestedPresentation),
      contact.label,
      contact.contact_id,
    )

    // Broadcast the message to all connections
    Websockets.sendMessageToAll('PRESENTATIONS', 'PRESENTATION_REPORTS', {
      presentation_reports: [presentationReport],
    })
  } catch (error) {
    console.log('Error updating presentation reports:')
    throw error
  }
}

const getAll = async () => {
  try {
    console.log('Fetching presentation reports!')
    let presentationReports = await Presentations.readPresentations()

    return presentationReports
  } catch (error) {
    console.log('Error fetching presentation reports:')
    throw error
  }
}

module.exports = {
  adminMessage,
  createPresentationReports,
  updatePresentationReports,
  getAll,
  requestSchemaPresentation,
}

const Contacts = require('./contacts')
