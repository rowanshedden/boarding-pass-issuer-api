const crypto = require('crypto')
const {v4: uuid} = require('uuid')

const sendAdminMessage = require('./transport')
const Governance = require('../agentLogic/governance')

// Generate operations and requests to be sent to the Cloud Agent Adminstration API

const requestPresentation = async (
  connectionID,
  predicates,
  attributes,
  name,
  comment,
  trace = false,
) => {
  try {
    let nonce = crypto.randomBytes(40).join('')

    const presentationRequest = {
      trace: trace,
      comment: comment,
      proof_request: {
        nonce: nonce,
        requested_predicates: predicates,
        requested_attributes: attributes,
        name: name,
        version: '1.0',
      },
      connection_id: connectionID,
    }

    const response = await sendAdminMessage(
      'post',
      `/present-proof/send-request`,
      {},
      presentationRequest,
    )

    console.log(response)

    return response
  } catch (error) {
    console.error('Presentations Error')
    throw error
  }
}

const requestPresentationBySchemaId = async (
  connectionID,
  attributes = [],
  schemaID,
  comment = 'Requesting Presentation',
  trace = false,
) => {
  try {
    console.log(`Requesting Presentation from Connection: ${connectionID}`)

    let nonce = crypto.randomBytes(40).join('')
    console.log(nonce)

    let requestedAttributes = {}

    //(AmmonBurgi) Create unique referent Key
    const uid = uuid()

    requestedAttributes[uid] = {
      names: attributes,
      restrictions: [{schema_id: schemaID}],
    }

    const schemaParts = schemaID.split(':')
    let schemaName = schemaParts[2]
    if (schemaName === 'dtc_type1_identity') schemaName = 'DTC Type-1 Identity'
    else schemaName = schemaName.replace('_', ' ')

    const presentationRequest = {
      trace: trace,
      comment: comment,
      proof_request: {
        nonce: nonce,
        requested_predicates: {},
        requested_attributes: requestedAttributes,
        name: schemaName,
        version: '1.0',
      },
      connection_id: connectionID,
    }

    const response = await sendAdminMessage(
      'post',
      `/present-proof/send-request`,
      {},
      presentationRequest,
    )

    console.log(response)

    return response
  } catch (error) {
    console.error('Presentations Error')
    throw error
  }
}
// end of DTC

// (eldersonar) Request identity proof. (the difference between this and above function is that we don't need to use schemas)
const requestProof = async (
  connectionID,
  attributes = [],
  comment = 'Requesting Proof Presentation',
  trace = false,
) => {
  try {
    console.log(`Requesting Proof from Connection: ${connectionID}`)

    let nonce = crypto.randomBytes(40).join('')
    console.log(nonce)

    // (eldersonar) Self attested presentation doesn't use the new presentation request architecture
    let requestedAttributes = {}
    for (var i = 0; i < attributes.length; i++) {
      requestedAttributes[attributes[i]] = {
        name: attributes[i],
        restrictions: [],
      }
    }

    const presentationRequest = {
      trace: trace,
      comment: comment,
      proof_request: {
        nonce: nonce,
        requested_predicates: {},
        requested_attributes: requestedAttributes,
        name: 'Proof request',
        version: '1.0',
      },
      connection_id: connectionID,
    }

    console.log(presentationRequest)

    const response = await sendAdminMessage(
      'post',
      `/present-proof/send-request`,
      {},
      presentationRequest,
    )

    console.log(response)

    return response
  } catch (error) {
    console.error('Presentations Proof Error')
    throw error
  }
}

module.exports = {
  requestPresentation,
  requestProof,
  requestPresentationBySchemaId,
}
