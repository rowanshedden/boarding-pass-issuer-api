const sendAdminMessage = require('./transport');

//Generate operations and requests to be sent to the Cloud Agent Adminstration API

//Fetch existing credential definitions request message to be sent to the Cloud Agent Adminstration API
const createdCredDefs = async () => {
	try{
		console.log("Fetching Created Credential Definitions");

		const credDefs = await sendAdminMessage('get', '/credential-definitions/created', {}, {});


		return credDefs;
		
	} catch (error) {
		console.error("Fetching Credential Definitions Error")
		throw error;
	}
}

const autoIssueCred = async (
		connectionID, 
		issuerDID, 
		credDefID, 
		schemaID, 
		schemaVersion, 
		schemaName, 
		schemaIssuerDID, 
		comment = '', 
		attributes = []
	) => {
	try{
		console.log("Auto Issue Credential to a Connection");

		const response = await sendAdminMessage('post', '/issue-credential/send', {}, {
    	"credential_proposal": {
		    "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/issue-credential/1.0/credential-preview",
		    "attributes": attributes
		  },
		  "connection_id": connectionID,
		  "cred_def_id": credDefID,
		  "issuer_did": issuerDID,
		  "schema_issuer_did": schemaIssuerDID,
		  "comment": comment,
		  "schema_name": schemaName,
		  "schema_id": schemaID,
		  "schema_version": schemaVersion
		});

		return response;
		
	} catch (error) {
		console.error("Credential Issuance Error")
		throw error;
	}
}

module.exports = {
	autoIssueCred,
	createdCredDefs,
}