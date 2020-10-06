const sendAdminMessage = require('./transport');

//Fetch existing credential definitions request message to be sent to the Cloud Agent Adminstration API
const createdCredDefIDs = async (
		cred_def_id, 
		issuer_did, 
		schema_id, 
		schema_issuer_did, 
		schema_name, 
		schema_version
	) => {
	try{
		console.log("Fetching Created Credential Definition IDs");

		const credDefs = await sendAdminMessage('get', `/credential-definitions/created`, {
			cred_def_id, 
			issuer_did, 
			schema_id, 
			schema_issuer_did, 
			schema_name, 
			schema_version
		}, {});


		return credDefs.credential_definition_ids;
		
	} catch (error) {
		console.error("Fetching Credential Definitions Error")
		throw error;
	}
}

const fetchCredDef = async (cred_def_id) => {
	try{
		console.log("Fetching Credential Definition");

		const credDef = await sendAdminMessage('get', `/credential-definitions/${cred_def_id}`, {}, {});


		return credDef.credential_definition;
		
	} catch (error) {
		console.error("Fetching Credential Definitions Error")
		throw error;
	}
}

module.exports = {
	createdCredDefIDs,
	fetchCredDef
}