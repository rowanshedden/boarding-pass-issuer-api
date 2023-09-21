require('dotenv').config()

const IssuanceRequests = require('../orm/issuanceRequests')
const Connections = require('./connections')
const Invitations = require('./invitations')
const Credentials = require('./credentials')

const addRequest = async function (
  contactId,
  invitationId,
  schemaId,
  attributes,
) {
  try {
    if ((invitationId && contactId) || (invitationId && !contactId)) {
      const invitation = await Invitations.getInvitation(invitationId)
      if (!invitation) {
        throw `No invitation was found by the invitation id ${invitationId}`
      } else {
        if (invitationId && contactId && invitation.contact_id !== contactId) {
          throw `The contact id ${contactId} doesn't match the contact id ${invitation.contact_id} on the found invitation`
        }
      }
    } else {
      const invitations = await Invitations.getInvitationsByContactId(contactId)
      if (!invitations.length) {
        throw `No invitations were found by the contact id ${contactId}`
      }
    }

    const issuanceRequest = await IssuanceRequests.addRequest(
      contactId,
      invitationId,
      schemaId,
      attributes,
    )
    console.log('Issuance request added: ', issuanceRequest)
    return issuanceRequest
  } catch (error) {
    console.error('Error recording issuance request')
    return {error}
  }
}

const handleCredentialIssued = async (connections, issuanceRequest) => {
  try {
    if (connections.length) {
      for (let i = 0; i < connections.length; i++) {
        // (eldersonar) Oneliner to delay execution of the fuction
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const schemaParts = issuanceRequest.schema_id.split(':')

        const credentialIssued = await Credentials.autoIssueCredential(
          connections[i].connection_id,
          undefined,
          undefined,
          issuanceRequest.schema_id,
          schemaParts[3],
          schemaParts[2],
          schemaParts[0],
          '',
          issuanceRequest.attributes,
        )

        if (credentialIssued.error) {
          throw credentialIssued.error
        } else {
          if (credentialIssued) {
            await IssuanceRequests.updateRequestStatus(
              issuanceRequest.request_id,
              'pending',
            )
          }
        }
      }
    } else {
      return {
        warning: `Waiting for connection(s) to become active for contact id ${issuanceRequest.contact_id}`,
      }
    }
    return true
  } catch (error) {
    return {error}
  }
}

const processRequests = async function (contactId, invitationId) {
  try {
    // (eldersonar) Get all credential issuance requests based on 3 main cases
    // 1. contact id provided, invitation id not provided
    // 2. contact id not provided, invitation id provided
    // 3. both contact id and invitation id provided
    const issuanceRequests = await IssuanceRequests.readRequestsByIdentifiers(
      contactId,
      invitationId,
      'new', // (eldersonar) I advise to keep "new" flag and change the "pending" flag to "complete". Or also changeing "new" flag to "pending"
    )

    if (issuanceRequests.length) {
      // (eldersonar) Process pending requests based on the intent encoded into the request itself
      for (let i = 0; i < issuanceRequests.length; i++) {
        // Send credential issuance to a connection matching invitation where contact id is also on that invitation
        if (
          (issuanceRequests[i].contact_id &&
            issuanceRequests[i].invitation_id) ||
          (!issuanceRequests[i].contact_id && issuanceRequests[i].invitation_id)
        ) {
          if (
            issuanceRequests[i].contact_id &&
            issuanceRequests[i].invitation_id
          ) {
            console.log(
              '============FLOW - contact id AND invitation id==============',
            )
          }

          if (
            !issuanceRequests[i].contact_id &&
            issuanceRequests[i].invitation_id
          ) {
            console.log(
              '============FLOW - NO contact id BUT invitation id==============',
            )
          }
          const invitation = await Invitations.getInvitation(invitationId)
          if (invitation) {
            // Check if the provided contact_id matches the one on the invitation
            if (
              issuanceRequests[i].contact_id &&
              issuanceRequests[i].invitation_id
            ) {
              if (invitation.contact_id !== issuanceRequests[i].contact_id) {
                // (eldersonar) I don't think we'll ever hit this check. As of today (12/20/22) if the user
                // provides wrong contact id it will break on the credential record creation
                console.log(
                  "There was an error. Contact id doesn't match the invitation record",
                )
              }
            }
            const connection = await Connections.getConnection(
              invitation.connection_id,
            )

            if (
              connection &&
              (connection.state === 'active' ||
                connection.state === 'completed')
            ) {
              let connections = [connection]

              const credentialIssued = await handleCredentialIssued(
                connections,
                issuanceRequests[i],
              )

              if (credentialIssued.error) {
                throw credentialIssued.error
              }
            } else {
              return {
                warning: `Waiting for connection to become active for invitation id ${issuanceRequests[i].invitation_id}`,
              }
            }
          } else {
            throw `No invitation was found by invitation id ${issuanceRequests[i].invitation_id}`
          }
        }

        // Send credential issuance to a all connections found by contact id
        else if (
          issuanceRequests[i].contact_id &&
          !issuanceRequests[i].invitation_id
        ) {
          console.log(
            '============FLOW - contact id AND NO invitation id==============',
          )
          let connections = []
          const rawConnections = await Connections.getConnectionsByContactId(
            issuanceRequests[i].contact_id,
          )
          if (rawConnections) {
            connections = rawConnections.filter((connection) => {
              return (
                connection.state === 'active' ||
                connection.state === 'completed'
              )
            })
          }

          const credentialIssued = await handleCredentialIssued(
            connections,
            issuanceRequests[i],
          )

          if (credentialIssued.error) {
            throw credentialIssued.error
          } else if (credentialIssued.warning) {
            return {warning: credentialIssued.warning}
          }
        } else {
          // (eldersonar) We should never hit this condition as far as I can tell. Needs to be tested more
          throw `Something went terribly wrong... No credential can be issued by either contact id ${contactId} or invitation id ${invitationId}`
        }
      }
    } else {
      throw 'No records were found by provided identifiers. The end of credential issuance flow...'
    }
  } catch (error) {
    // (eldersonar) Make sure to return proper error based on where it was generated.
    // The first case is checking for the adminAPI error, the second one will habdle custom errors
    return error.message
      ? {error: error.message, code: error.code}
      : {error: error.reason}
  }
}

module.exports = {
  addRequest,
  processRequests,
}
