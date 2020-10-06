const AdminAPI = require('../adminAPI');

//Perform Agent Business Logic

const setPublicDID = async (did) => {
	try{
		const response = await AdminAPI.DIDs.setPublicDID(did);
		console.log(response);

		return;
	} catch (error){
		console.error("Error Setting Public DID");
		throw error;
	}
}

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


const createDID = async () => {
	try{
		const did = await AdminAPI.DIDs.createDID();
		console.log(did);


		return did;

	} catch (error){
		console.error("Error Creating DID");
		throw error;
	}
}



module.exports = {
	createDID,
	fetchPublicDID,
	setPublicDID
}