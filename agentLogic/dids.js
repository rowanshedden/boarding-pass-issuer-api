const AdminAPI = require('../adminAPI');

//Perform Agent Business Logic


const fetchPublicDID = async () => {
	try{
		const publicDID = await AdminAPI.DIDs.fetchPublicDID();
		console.log(publicDID);


		return publicDID;

	} catch (error){
		console.error("Error Fetching Public DID");
		throw error;
	}
}


module.exports = {
	fetchPublicDID
}