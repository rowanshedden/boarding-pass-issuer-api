const ControllerError = require('../errors.js');

const AdminAPI = require('../adminAPI');
const CredDefs = require('./credDefs.js');
const Contacts = require('./contacts.js');
const DIDs = require('./dids.js');
const Schemas = require('./schemas.js');

//Perform Agent Business Logic

//Auto Credential Issuance
const autoIssueCredential = async (
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
		//Perform Validations

		//Validate Connection
		const connection = await Contacts.fetchConnection(connectionID);

		if(!connection){
			console.error("Connection Not Present");
			throw new ControllerError(2, "Connection Not Present");
		}
		else if(connection.state !== 'active'){
			console.error("Connection Not Ready to Receive Credentials");
			throw new ControllerError(3, "Connection Not Active");
		}

		//Validate Public DID
		const publicDID = await DIDs.fetchPublicDID();

		if(!publicDID){
			console.error("Public DID Not Set");
			throw new ControllerError(4, "Public DID Not Set");
		}




		//Validate Credential Definition
		const credDefIDs = await CredDefs.createdCredDefIDs(
			credDefID, 
			issuerDID, 
			schemaID, 
			schemaIssuerDID, 
			schemaName, 
			schemaVersion
		);

		//Fetch Credential Definition to check the schema utilized
		const credDef = await CredDefs.fetchCredDef(credDefID);

		if(credDefIDs.length <= 0){
			console.error("Credential Definition ID Invalid");
			throw new ControllerError(5, "Credential Definition ID Invalid");
		}


		//Validate Schema
		const schema = await Schemas.fetchSchema(schemaID);

		if(!schema){
			console.error("Schema ID Invalid");
			throw new ControllerError(6, "Schema ID Invalid");
		}
		//Check to see if the schema used in the cred def is the specified schema
		else if(schema.seqNo != credDef.schemaId){
			console.error("Credential Definition's Schema Doesn't Match The Supplied Schema");
			throw new ControllerError(7, "Credential Definition's Schema Doesn't Match The Supplied Schema");
		}


		//Validate the Attributes
		//Ensure all attributes based on the schema have been assigned a value 
		for(var i = 0; i < schema.attrNames.length; i++){
			const accounted = attributes.some((attribute) => {
				if(attribute.name === schema.attrNames[i]){
					return true;
				}
				else{
					return false;
				}
			})

			if(!accounted){
				console.error("Attribute(s) Not Assigned Values");
				throw new ControllerError(8, "Attribute(s) Not Assigned Values");
			}
		}

		const response = await AdminAPI.Credentials.autoIssueCred(
			connectionID, 
			issuerDID, 
			credDefID, 
			schemaID, 
			schemaVersion, 
			schemaName, 
			schemaIssuerDID, 
			comment, 
			attributes,
			false,
			false
		);

	} catch (error) {
		console.error("Error Issuing Credential");
		throw error;
	}
}

module.exports = {
	autoIssueCredential
}