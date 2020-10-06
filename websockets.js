const WebSocket = require('ws');
const server = require('./index.js').server;

const ControllerError = require('./errors.js');

const Invitations = require('./agentLogic/invitations');
const Credentials = require('./agentLogic/credentials');

wss = new WebSocket.Server({server: server, path: '/api/ws'});
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
			case 'AUTO_ISSUE_CREDENTIAL':
				console.log("Auto Issuing Credential");

				await Credentials.autoIssueCredential(
					"539ffdc1-d992-4b8f-989d-d0c012b24d3e",
				  "KrU728EueAafyBJkDe8fbs",
					"KrU728EueAafyBJkDe8fbs:3:CL:125221:default",
				  "W1vtCQVTy1aMJAjsHt5UK4:2:Covid_19_Lab_Result:1.3",
				  "1.3",
				  "Covid_19_Lab_Result",
				  "W1vtCQVTy1aMJAjsHt5UK4",
				  '',
				  [
			      {
			        "name": "result",
			        "value": "negative"
			      },
			      {
			        "name": "sending_facility",
			        "value": "Bronx RHIO"
			      },
			      {
			        "name": "lab_specimen_collected_date",
			        "value": "2020-09-21 00:00:00"
			      },
			      {
			        "name": "patient_first_name",
			        "value": "James"
			      },
			      {
			        "name": "patient_last_name",
			        "value": "Ebert"
			      },
			      {
			        "name": "lab_description",
			        "value": "Covid-19 PCR Test"
			      },
			      {
			        "name": "normality",
			        "value": ""
			      },
			      {
			        "name": "result_status",
			        "value": ""
			      },
			      {
			        "name": "comment",
			        "value": ""
			      },
			      {
			        "name": "date_time_of_message",
			        "value": ""
			      },
			      {
			        "name": "ordering_facility_name",
			        "value": ""
			      },
			      {
			        "name": "ordering_facility_address",
			        "value": ""
			      },
			      {
			        "name": "performing_lab",
			        "value": ""
			      },
			      {
			        "name": "visit_location",
			        "value": ""
			      },
			      {
			        "name": "lab_order_id",
			        "value": ""
			      },
			      {
			        "name": "lab_code",
			        "value": ""
			      },
			      {
			        "name": "lab_coding_qualifer",
			        "value": ""
			      },
			      {
			        "name": "observation_date_time",
			        "value": ""
			      },
			      {
			        "name": "mpid",
			        "value": ""
			      },
			      {
			        "name": "patient_local_id",
			        "value": ""
			      },
			      {
			        "name": "patient_date_of_birth",
			        "value": ""
			      },
			      {
			        "name": "patient_gender_legal",
			        "value": ""
			      },
			      {
			        "name": "patient_phone",
			        "value": ""
			      },
			      {
			        "name": "patient_street_address",
			        "value": ""
			      },
			      {
			        "name": "patient_city",
			        "value": ""
			      },
			      {
			        "name": "patient_state",
			        "value": ""
			      },
			      {
			        "name": "patient_postalcode",
			        "value": ""
			      },
			      {
			        "name": "patient_country",
			        "value": ""
			      }
			    ]
				);

				sendMessage(ws, "CREDENTIAL_OFFERED", {});
				break;
			default:
				console.error(`Unrecognized Message Type: ${messageType}`)
				sendErrorMessage(ws, 1, "Unrecognized Message Type");
				break;
		}
	} catch (error){
		if(error instanceof ControllerError){
			console.error("Controller Error in Message Handling", error);
			sendErrorMessage(ws, error.code, error.reason);
		}
		else{
			console.error("Error In Websocket Message Handling", error);
			sendErrorMessage(ws, 0, "Internal Error");
		}
	}
}

