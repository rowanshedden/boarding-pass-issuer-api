const express = require('express')
const http = require('http');
const bodyParser = require('body-parser');

const axios = require('axios');

let app = express();
let server = http.createServer(app);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

server.listen(3100, () => console.log(`Server listening at http://localhost:3100`));

app.use('/create-invitation', (req, res) => {
	console.log("Front End Request", req.url);
	console.log(req.body);

	axios({
    method: 'post',
    url:`http://192.168.0.104:8150/connections/create-invitation`,
    params:{
    	alias: "Enterprise Invite",
    }
  })
  .then(async (response) => {
    console.log(response.data);
    res.status(200).send(response.data.invitation_url)
  })
  .catch((error) => {
    console.error(error);
    res.status(500).send("Server Error")
  })
  .finally(() => {
  	console.log("Finished Admin Call");
  })

})



app.use('/controller-webhook/topic/connections', (req, res) => {
	console.log("ACAPy Webhook Message");
	console.log(req.body);
	if(req.body.their_label === 'James'){
		console.log("James Agent");
		if(req.body.state === 'active'){
			console.log("Connection Is Active");

			axios({
		    method: 'post',
		    url:`http://192.168.0.104:8150/issue-credential/send`,
		    data:{
		    	"credential_proposal": {
				    "@type": "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/issue-credential/1.0/credential-preview",
				    "attributes": [
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
				  },
				  "connection_id": req.body.connection_id,
				  "cred_def_id": "9DBhMpLFUjvyUFBcP4w8up:3:CL:125221:Covid_19_Lab_Result_1.3",
				  "issuer_did": "9DBhMpLFUjvyUFBcP4w8up",
				  "schema_issuer_did": "W1vtCQVTy1aMJAjsHt5UK4",
				  "comment": "Covid Issuance",
				  "schema_name": "Covid_19_Lab_Result",
				  "schema_id": "W1vtCQVTy1aMJAjsHt5UK4:2:Covid_19_Lab_Result:1.3",
				  "schema_version": "1.3"
		    }
		  })
		  .then(async (response) => {
		    console.log(response.data);
		    res.status(200).send(response.data.invitation_url)
		  })
		  .catch((error) => {
		    console.error(error);
		    res.status(200).send()
		  })
		  .finally(() => {
		  	console.log("Finished Admin Call");
		  })
		}
		else{
			res.status(200).send()
		}
	}
	else{
		res.status(200).send()
	}
})
app.use('/controller-webhook', (req, res) => {
	console.log("ACAPy Webhook Message");
	console.log(req.body);
	res.status(200).send()
})

app.use('/second-controller', (req, res) => {
	console.log("Second ACAPy Webhook Message");
	res.status(200).send()
})

app.use('/', (req, res) => {
	console.log("Requested outside of normal paths", req.url);
	console.log(req.body);
	res.status(404).send()
})