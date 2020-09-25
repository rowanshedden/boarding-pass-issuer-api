const axios = require('axios');

//Function to send a request to the Cloud Agent Administration API
const sendAdminMessage = async (method, path, params = {}) => {
	try{
		console.log("Sending Admin API Message");
		const response = await axios({
	    method: method,
	    url:`${process.env.AGENTADDRESS}${path}`,
	    params: params
	  })

	  return response.data;
  } catch(error) {
    console.error('Admin API Request Error');
    throw error;
  }
}

module.exports = sendAdminMessage;