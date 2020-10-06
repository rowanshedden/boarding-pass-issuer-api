const sendAdminMessage = require('./transport');

//Generate operations and requests to be sent to the Cloud Agent Adminstration API

//Fetch the set public DID message to be sent to the Cloud Agent Adminstration API
const fetchPublicDID = async () => {
	try{
		console.log("Fetching Public DID from AdminAPI");

		const publicDID = await sendAdminMessage('get', `/wallet/did/public`, {}, {})

		return publicDID.result;
		
	} catch (error) {
		console.error("Public DID Fetching Error")
		throw error;
	}
}


module.exports = {
	fetchPublicDID
}