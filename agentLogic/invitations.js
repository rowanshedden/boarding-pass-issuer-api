const AdminAPI = require('../adminAPI/connections');

//Perform Agent Business Logic


const createInvitation = async () => {
	try{
		const invitationMessage = await AdminAPI.createInvitation();
		console.log(invitationMessage);

		return invitationMessage.invitation_url;

	} catch (error){
		console.error("Error Creating Invitation");
		throw error;
	}
}

module.exports = {
	createInvitation
}