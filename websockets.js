const WebSocket = require('ws');
const server = require('./index.js').server;

const Invitations = require('./agentLogic/invitations');

wss = new WebSocket.Server({server: server, path: '/ws'});
console.log("Websockets Setup");

wss.on('connection', (ws) => {
	console.log("New Connection");

	ws.on('message', (message) => {
		try{
			const parsedMessage = JSON.parse(message);
			console.log("New Websocket Message:", parsedMessage);

			messageHandler(ws, parsedMessage.messageType, parsedMessage.messageData);
		} catch (error){
			console.error(error)
		}
	})
})

//Send an outbound message to a websocket client
const sendMessage = (ws, messageType, messageData = {}) => {
	console.log(`Sending Message to websocket client of type: ${messageType}`);
	try{
		ws.send(JSON.stringify({messageType, messageData}));
	}
	catch(error){
		console.error(error);
		throw error;
	}
}

//Send an Error Message to a websocket client
const sendErrorMessage = (ws, errorCode, errorReason) => {
	try{
		console.log("Sending Error Message");

		sendMessage(ws, "SERVER_ERROR", {errorCode, errorReason});
	} catch(error) {
		console.error("Error Sending Error Message to Client");
		console.error(error);
	}
}

//Handle inbound messages
const messageHandler = async (ws, messageType, messageData = {}) => {
	try{
		switch (messageType) {
			case 'CREATE_INVITATION':
				console.log("Create Invitation Requested");

				const invitationURL = await Invitations.createInvitation();
				sendMessage(ws, "NEW_INVITATION", {invitationURL});

				break;
			default:
				console.error(`Unrecognized Message Type: ${messageType}`)
				sendErrorMessage(ws, 001, "Unrecognized Message Type");
				break;
		}
	} catch (error){
		console.error("Error In Websocket Message Handling");
		sendErrorMessage(ws, 000, "Internal Error");
	}
}

