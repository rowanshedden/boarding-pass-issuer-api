const sendAdminMessage = require('./transport');

//Generate operations and requests to be sent to the Cloud Agent Adminstration API

//Create an invitation request message to be sent to the Cloud Agent Adminstration API
const createInvitation = async () => {
	try{
		console.log("Generating Invitation");

		const invitationMessage = await sendAdminMessage('post', '/connections/create-invitation', {alias:"Enterprise Invite"})

		return invitationMessage;
		
	} catch (error) {
		console.error("Invitation Creation Error")
		throw error;
	}
}

module.exports = {
	createInvitation
}