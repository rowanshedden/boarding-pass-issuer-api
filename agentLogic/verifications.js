// Invitation request API
const Invitations = require('./invitations')
const Presentations = require('./presentations')
const Contacts = require('./contacts')

const Verifications = require('../orm/verifications')
const AdminAPI = require('../adminAPI')

var deferred = require('deferred')

var pending_verifications = {}

const startRule = async (id, verificationList) => {
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
  let invitation = await Invitations.getInvitation(id)

  let iteration = 0
  const requestPresentationByVerification = async () => {
    const result = await Presentations.requestSchemaPresentation(
      invitation.connection_id,
      verificationList[iteration].schema_attributes,
      verificationList[iteration].schema_id,
    )

    if (result) {
      await verificationList[iteration].update({
        presentation_exchange_id: result.presentation_exchange_id,
        proof_state: result.state,
      })
    }
    if (iteration !== verificationList.length - 1) {
      iteration++
      requestPresentationByVerification()
    }
  }

  await requestPresentationByVerification()
}

const handleConnection = async (connectionMessage) => {
  console.log('VERIFICATIONS - handle connection')

  const invitation = await Invitations.getInvitationByConnectionId(
    connectionMessage.connection_id,
  )

  if (!invitation) {
    console.log('No Invitation could be found for verification workflow.')
    return
  }

  let verifications = await Verifications.readVerificationsByInvitationId(
    invitation.invitation_id,
  )

  if (!verifications || verifications.length === 0) {
    console.log(
      'There is no verification record found... end of verification flow',
    )
    return
  }

  await Promise.all(
    verifications.map(async (verRecord) => {
      await verRecord.update({
        connection_state: connectionMessage.state,
      })
    }),
  )

  if (connectionMessage.state === 'active') {
    console.log('STARTING THE RULE')
    startRule(invitation.invitation_id, verifications)
  } else {
    console.log('NOT STARTING THE RULE')
    console.log(connectionMessage['state'])
  }
}

const handlePresentation = async (presMessage) => {
  const invitation = await Invitations.getInvitationByConnectionId(
    presMessage.connection_id,
  )

  let verification = await Verifications.readVerificationsByInvitationAndPresExchangeId(
    invitation.invitation_id,
    presMessage.presentation_exchange_id,
  )

  if (!verification) {
    return false
  }

  await verification.update({
    proof_state: presMessage.state,
  })

  if (presMessage.state === 'verified') {
    const {revealed_attr_groups} = presMessage.presentation.requested_proof

    var result_data = []

    Object.keys(revealed_attr_groups).forEach((key) => {
      Object.keys(revealed_attr_groups[key].values).forEach((valueKey) => {
        result_data.push({
          name: valueKey,
          value: revealed_attr_groups[key].values[valueKey].raw,
        })
      })
    })

    if (presMessage.state === 'verified') {
      console.log('Presentation Verified')
      await verification.update({
        complete: true,
        result: true,
        result_string: 'Verified',
        result_data: result_data,
        connection_id: presMessage.connection_id,
      })

      try {
        console.log(pending_verifications[verification.verification_id])

        pending_verifications[verification.verification_id].resolve(true)
      } catch (e) {} // we may attempted notifying a record that no longer exists.
    } else {
      console.log('Presentation not Verified')
      await verification.update({
        complete: true,
        result: false,
        result_string: 'Not Verified',
        result_data: null,
        connection_id: presMessage.connection_id,
      })
    }
  }

  return true
}

const verify = async (data) => {
  try {
    let connection = null

    let verificationList = []

    await Promise.all(
      data.schemas.map(async (schema) => {
        let newVerificationRecord = await Verifications.createVerificationRecord(
          {
            connection_id: null,
            contact_id: data.contact_id ? data.contact_id : null,
            invitation_id: data.invitation_id ? data.invitation_id : null,
            schema_id: schema.schema_id,
            schema_attributes: schema.schema_attributes,
            timeout: data.timeout,
            rule: data.rule,
            meta_data: data.meta_data,
            complete: false,
            result: false,
            result_string: null,
            result_data: null,
            error: '',
          },
        )

        verificationList.push(newVerificationRecord)
      }),
    )

    if (data.contact_id || data.invitation_id) {
      // (eldersonar) The contact_id path is not implemented and shouldn't be used for now
      // Get connection by contact_id
      if (data.contact_id) {
        console.log('Fetching contact')
        const contact = await Contacts.getContact(data.contact_id)

        console.log('contact is: ', contact)
        if (contact && contact.connection_id) {
          console.log('Fetching connection by connection id')
          console.log(contact.connection_id)
          connection = await AdminAPI.Connections.fetchConnection(
            contact.connection_id,
          )
        } else {
          console.log('No connections were found')
        }
      }
      // Get connection by invitation_id
      else if (data.invitation_id) {
        console.log('Fetching invitation')
        const invitation = await Invitations.getInvitation(data.invitation_id)

        if (invitation && invitation.connection_id) {
          console.log('Fetching connection by connection id')
          console.log(invitation.connection_id)
          connection = await AdminAPI.Connections.fetchConnection(
            invitation.connection_id,
          )
        } else {
          console.log('No connections were found...')
        }
      } else {
        console.log('There is nothing to fetch connections with...')
      }

      let timeout = 0

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

      let deferredArray = []

      if (verificationList) {
        verificationList.forEach((verRecord) => {
          const def = deferred()
          deferredArray.push(def)

          pending_verifications[verRecord.verification_id] = def
        })

        console.log('Connection record is: ', connection)

        if (connection && connection.state === 'active') {
          // we already have an active connection, so send presentation request
          await startRule(data.invitation_id, verificationList)
        }

        // we need to wait for the presentation
        // we also need to consider the timeout...
        // so we wait for which everone finishes first

        //Wait for all promises
        await Promise.all(
          deferredArray.map(async (def) => {
            await Promise.race([TimeDelay, def.promise])
          }),
        )

        verificationList.forEach((verRecord) => {
          delete pending_verifications[verRecord.verification_id]
        })

        // remove deferred object from webhook handling
        // get latest verification state
        // TODO: use the agent logic function instead
        let verifiedList = []

        await Promise.all(
          verificationList.map(async (verRecord) => {
            let verificationRecord = await Verifications.Verification.findOne({
              where: {
                verification_id: verRecord.verification_id,
              },
            })

            verifiedList.push(verificationRecord)
          }),
        )

        return verifiedList
      } else {
        console.log('No verification record found. Return...')
        return
      }
    } else {
      console.log('No contact id or invitation id was provided')
    }
  } catch (e) {
    console.log(e)
  }
}

const retrieve = async (verification_id) => {
  try {
    const verification = await Verifications.Verification.findOne({
      where: {
        verification_id: verification_id,
      },
    })

    // console.log('Retrieved verification record: ', verification)

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
