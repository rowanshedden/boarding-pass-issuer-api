const sendAdminMessage = require('./transport')

// Generate operations and requests to be sent to the Cloud Agent Adminstration API

// Auto issue a credential to a connection via the admin API
const autoIssueCred = async (
  connectionID,
  issuerDID,
  credDefID,
  schemaID,
  schemaVersion,
  schemaName,
  schemaIssuerDID,
  comment = '',
  attributes = [],
  trace,
  autoRemove,
) => {
  try {
    console.log('Auto Issue Credential to a Connection')

    const response = await sendAdminMessage(
      'post',
      `/issue-credential/send`,
      {},
      {
        cred_def_id: credDefID,
        schema_id: schemaID,
        auto_remove: autoRemove,
        credential_proposal: {
          '@type':
            'did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/issue-credential/1.0/credential-preview',
          attributes: attributes,
        },
        schema_issuer_did: schemaIssuerDID,
        schema_name: schemaName,
        comment: comment,
        issuer_did: issuerDID,
        connection_id: connectionID,
        schema_version: schemaVersion,
        trace: trace,
      },
    )

    return response
  } catch (error) {
    console.error('Credential Issuance Error')
    return {
      error: {
        message: error.response.statusText,
        code: error.response.status,
      },
    }
  }
}

module.exports = {
  autoIssueCred,
}
