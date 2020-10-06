const AdminAPI = require('../adminAPI');

//Perform Agent Business Logic


const createdCredDefIDs = async (
		credDefID, 
		issuerDID, 
		schemaID, 
		schemaIssuerDID, 
		schemaName, 
		schemaVersion
	) => {
	try{
		const credDefIDs = await AdminAPI.CredDefs.createdCredDefIDs(
			credDefID, 
			issuerDID, 
			schemaID, 
			schemaIssuerDID, 
			schemaName, 
			schemaVersion
		);

		console.log(credDefIDs);

		return credDefIDs;

	} catch (error){
		console.error("Error Fetching Created Credential Definitions IDs");
		throw error;
	}
}

const fetchCredDef = async (credDefID) => {
	try{
		//(JamesKEbert)TODO: Query in DB before attempting to fetch via admin api
		const credDef = await AdminAPI.CredDefs.fetchCredDef(credDefID);

		//console.log(credDef);

		return credDef;

	} catch (error){
		console.error("Error Fetching Credential Definition");
		throw error;
	}
}

const createCredDef = async (tag = 'default', schema_id) => {
	try{
		const credDefID = await AdminAPI.CredDefs.createCredDef(tag, schema_id, 0, false);

		console.log(credDefID);

		return credDefID;

	} catch (error){
		console.error("Error Creating Credential Definition");
		throw error;
	}
}


module.exports = {
	createCredDef,
	createdCredDefIDs,
	fetchCredDef
}