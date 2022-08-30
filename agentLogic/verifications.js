// Invitation request API
const Invitations = require('./invitations')
const Connections = require('../orm/connections')
const Verifications = require('../orm/verifications')
const AdminAPI = require('../adminAPI')

var deferred = require('deferred')

var pending_verifications = {}

const createVerification = async (
  verification_id,
  // processor_id
  // merchant_id
  connection_id,
  contact_id,
  invitation_id,
  // connection_state
  schema_id,
  schema_attributes,
  timeout,
  rules,
  meta_data,
  complete,
  results,
  result_string,
  result_data,
  // proof_state
  presentation_exchange_id,
  error,
  // result
  created_at,
  updated_at,
) => {
  try {
    const verification = await Verifications.createVerificationRecord(
      verification_id,
      // processor_id
      // merchant_id
      connection_id,
      contact_id,
      invitation_id,
      // connection_state
      schema_id,
      schema_attributes,
      timeout,
      rules,
      meta_data,
      complete,
      results,
      result_string,
      result_data,
      // proof_state
      presentation_exchange_id,
      error,
      // result
      created_at,
      updated_at,
    )

    return verification
  } catch (error) {
    console.error('Could not create verification', error)
  }
}

// const getVerification = async (verification_id) => {
//   try {
//     const verification = await Verifications.readVerifications(verification_id)
//     return verification
//   } catch (error) {
//     console.error('Could not retrieve verification record', error)
//   }
// }

// const handleVerification = async (message) => {
//   try {
//     let schemaID
//     if (message.state === 'verified')
//     schemaID = message.presentation.identifiers[0].schema_id

//     let revealedAttributes;
//     let verifiedAttributes = {};
//     if (message.presentation && message.presentation.requested_proof) {
//       revealedAttributes = message.presentation.requested_proof.revealed_attrs

//       for (const key in revealedAttributes) {
//         verifiedAttributes[key] = revealedAttributes[key].raw
//       }
//     }

//     const verification = await createVerification(
//       message.connection_id,
//       undefined,
//       undefined,
//       schemaID,
//       JSON.stringify(verifiedAttributes),
//       null,
//       undefined,
//       undefined,
//       undefined,
//       message.verified,
//       message.state,
//       undefined,
//       message.presentation_exchange_id,
//       undefined,
//     )

//     console.log('--------------Verification Record------------')
//     console.log(verification)
//     console.log('--------------Verification Record------------')

//     console.log('=====================Verification Message==============')
//     console.log(message)
//     // console.log('===============----================')
//     // console.log(message.presentation.requested_proof.revealed_attrs)
//     console.log('=====================Verification Message==============')
//   } catch (err) {
//     console.log(err)
//   }
// }

const startRule = async (verification) => {
  // we call this here to get the presentation id before getting webhook notifications
  /*
    TODO this workflow doesn't work right now. By not having the 
    presentation id before sending the request to the endpoint
    we have a small chance that we may have a race condition that
    we receive a notification that the request has been fulfilled
    before we update the verification db record.

    const presentation = await AdminAPI.Presentations.createPresentation(
      ['phone', 'identity_image', 'date_validated'],
      'MzGj69GREx94fR2af2xYEC:2:Level_1_Phone:1.1',
      'Requesting Presentation',
      false,
    )
    
    verification.update({
      presentation_exchange_id: presentation.presentation_exchange_id,
      proof_state: presentation.state,
    })

    // we have to repeate the details ??? TODO ask if this is required or not...
    const result = await AdminAPI.Presentations.sendPresentation(
      verification.connection_id,
      presentation.presentation_exchange_id,
      ['phone', 'identity_image', 'date_validated'],
      'MzGj69GREx94fR2af2xYEC:2:Level_1_Phone:1.1',
      'Requesting Presentation',
      false,
    )
*/

  // TODO This workflow may contain a race condition
  const result = await AdminAPI.Presentations.requestPresentation(
    verification.connection_id,
    ['date_of_birth'],
    'MzGj69GREx94fR2af2xYEC:2:Drivers_License:1.0',
    'Requesting Presentation',
    false,
  )

  await verification.update({
    presentation_exchange_id: result.presentation_exchange_id,
    proof_state: result.state,
  })
}

const handleConnection = async (connectionMessage) => {
  var verification = await Verifications.Verification.findOne({
    where: {
      connection_id: connectionMessage['connection_id'],
    },
  })

  if (null == verification) return

  await verification.update({
    connection_state: connectionMessage['state'],
  })

  if ('active' == connectionMessage['state']) {
    startRule(verification)
  }
}

const handlePresentation = async (presMessage) => {
  verification = await Verifications.Verification.findOne({
    where: {
      connection_id: presMessage['connection_id'],
      presentation_exchange_id: presMessage['presentation_exchange_id'],
    },
  })

  if (null == verification) return

  await verification.update({
    proof_state: presMessage['state'],
  })

  const {revealed_attrs} = presMessage.presentation.requested_proof

  var result_data = []

  Object.keys(revealed_attrs).forEach((key) => {
    if (verification.rule == 'age' && key == 'date_of_birth') {
      var date_of_birth = parseInt(revealed_attrs[key]['raw'])
      var dates = {
        18: Math.floor(
          new Date(new Date().setFullYear(new Date().getFullYear() - 18)) /
            1000,
        ),
        21: Math.floor(
          new Date(new Date().setFullYear(new Date().getFullYear() - 21)) /
            1000,
        ),
        60: Math.floor(
          new Date(new Date().setFullYear(new Date().getFullYear() - 60)) /
            1000,
        ),
      }

      console.log(date_of_birth)
      var age_values = []

      Object.keys(dates).forEach((date_key) => {
        var over = date_of_birth < dates[date_key]

        age_values.push({
          age: date_key,
          over: over,
        })
      })

      result_data.push({
        name: 'ages',
        value: age_values,
      })
    }

    result_data.push({
      name: key,
      value: revealed_attrs[key]['raw'],
    })
  })

  if ('verified' == presMessage['state']) {
    await verification.update({
      complete: true,
      result: true,
      result_string: 'Verified',
      result_data: result_data,
    })

    try {
      pending_verifications[verification.connection_id].resolve(true)
    } catch (e) {} // we may attempted notifying a record that no longer exists.
  }
}

const verify = async (data) => {
  console.log('test verification')

  try {
    var connection = null

    if (data.connection_id) {
      connection = await AdminAPI.Connections.fetchConnection(
        data.connection_id,
      )

      if (connection == null) {
        // create error record and exit
        var verification_request = {
          connection_id: data.connection_id,
          contact_id: data.contact_id,
          invitation_id: data.invitation_id,
          schema_id: data.schema_id,
          schema_attributes: data.attributes,
          timeout: data.timeout,
          rule: data.rule,
          meta_data: data.meta_data,
          complete: true,
          result: false,
          result_string: null,
          result_data: null,
          error: 'Invalid connection_id',
        }

        var verification = await Verifications.Verification.create(
          verification_request,
        )

        return verification
      }
    } else {
      connection = await Invitations.acceptInvitation(
        data.connection_data,
        false,
      )
    }

    // create db record to work with
    var verification_request = {
      connection_id: data.connection_id,
      contact_id: data.contact_id,
      invitation_id: data.invitation_id,
      schema_id: data.schema_id,
      schema_attributes: data.attributes,
      timeout: data.timeout,
      rule: data.rule,
      meta_data: data.meta_data,
      complete: false,
      result: null,
      result_string: null,
      result_data: null,
      error: null,
    }

    var verification = await Verifications.Verification.create(
      verification_request,
    )

    // register to listen for notifications

    var timeout = 0

    // Ensure timeout has a valid value. Zero is acceptable.
    if (null == data.timeout || 0 > data.timeout) {
      timeout = 0
    } else {
      timeout = data.timeout * 1000 // API is in seconds, so multiple by 1000 milliseconds
    }

    if (timeout > 60000 * 5) {
      // Limit timeout to five minutes
      timeout = 60000 * 5
    }

    const TimeDelay = new Promise((resolve, reject) => {
      setTimeout(resolve, timeout, true)
    })

    var def = deferred()

    pending_verifications[verification.connection_id] = def

    if ('active' != connection.state) {
      // activate connection
      connection = await Invitations.acceptExistingInvitation(
        connection.connection_id,
      )
    } else {
      // we already have an active connection, so send presentation request
      await startRule(verification)
    }

    // we need to wait for the presentation
    // we also need to consider the timeout...
    // so we wait for which everone finishes first
    value = await Promise.race([TimeDelay, def.promise])

    // remove deferred object from webhook handling
    delete pending_verifications[verification.connection_id]

    // get latest verification state
    verification = await Verifications.Verification.findOne({
      where: {
        verification_id: verification.verification_id,
      },
    })

    console.log('Reached verification return')

    return verification
  } catch (e) {
    console.log(e)
  }
}

const retrieve = async (verification_id) => {
  try {
    verification = await Verifications.Verification.findOne({
      where: {
        verification_id: verification_id,
      },
    })

    return verification
  } catch (e) {
    console.log(e)
  }
}

module.exports = {
  handleConnection,
  handlePresentation,
  retrieve,
  verify,
}
