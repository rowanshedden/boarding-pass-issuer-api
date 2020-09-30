const ControllerError = require('../errors.js');

const AdminAPI = require('../adminAPI');
const Contacts = require('./contacts.js');
const DIDs = require('./dids.js');

//Perform Agent Business Logic


const fetchCreatedCredDefs = async (schemaID, credDefID) => {
	try{
		const credDefs = await AdminAPI.Credentials.createdCredDefs();
		console.log(credDefs);


		return credDefs;

	} catch (error){
		console.error("Error Fetching Created Credential Definitions");
		throw error;
	}
}

//Auto Credential Issuance
const autoIssueCredential = async (
		connectionID, //verify
		issuerDID, //fetch/verify
		credDefID, //verify
		schemaID, //verify via cred def
		schemaVersion, //^
		schemaName, //^
		schemaIssuerDID, //^
		comment = '', 
		attributes = []//verify attrs <- later
	) => {
	try{
		//Perform Validations

		//Validate Connection
		//(JamesKEbert)TODO:Change Connection Validation to validating against Controller DB versus Admin API Call
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
		//(JamesKEbert):Should this validate a cached copy in the DB, or use the Admin API everytime?
		//const publicDID = await DIDs.fetchPublicDID();


		//Validate Credential Definition
		//Validate Schema from Credential Definition
		//Validate the Attributes

		/*await fetchCreatedCredDefs();

		const response = await AdminAPI.Credentials.autoIssueCred(
			connectionID, 
			issuerDID, 
			credDefID, 
			schemaID, 
			schemaVersion,
			schemaName,
			schemaIssuerDID,
			comment = '', 
			attributes = []
		);
		console.log("Response:", response);*/


		return null;

	} catch (error) {
		console.error("Error Issuing Credential");
		throw error;
	}
}
/*"credential_proposal": {
		    "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/issue-credential/1.0/credential-preview",
		    "attributes": [
		      {
		        "name": "issuer",
		        "value": "Bronx RHIO"
		      },
		      {
		        "name": "date",
		        "value": "2020-09-28"
		      }
		    ]
		  },
		  "connection_id": "e18360d1-2be9-404c-92f7-f42f5de610be",
		  "cred_def_id": "ME9VikYwUtb9mRhxW5W68Z:3:CL:146204:High-Five_1.0",
		  "issuer_did": "ME9VikYwUtb9mRhxW5W68Z",
		  "schema_issuer_did": "ME9VikYwUtb9mRhxW5W68Z",
		  "comment": "",
		  "schema_name": "High-Five",
		  "schema_id": "ME9VikYwUtb9mRhxW5W68Z:2:High-Five:1.0",
		  "schema_version": "1.0"*/
module.exports = {
	fetchCreatedCredDefs,
	autoIssueCredential
}