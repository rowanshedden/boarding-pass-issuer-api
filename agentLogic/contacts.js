const AdminAPI = require('../adminAPI');

//Perform Agent Business Logic


const fetchConnection = async (connectionID) => {
	try{
		const connection = await AdminAPI.Connections.fetchConnection(connectionID);
		console.log(connection);


		return connection;

	} catch (error){
		console.error("Error Fetching Connection");
		throw error;
	}
}


module.exports = {
	fetchConnection
}