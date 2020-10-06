const express = require('express')
const http = require('http');
const bodyParser = require('body-parser');

const axios = require('axios');

const agentWebhookRouter = require('./agentWebhook');

//NOTE(JamesKEbert): Env Variables potentially to be removed upon containerization setup. May also consider other libraries/methods as well.

let app = express();
let server = http.createServer(app);

module.exports.server = server;
let Websocket = require('./websockets.js')

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

server.listen(process.env.CONTROLLERPORT || 3100, () => console.log(`Server listening at http://localhost:${process.env.CONTROLLERPORT || 3100}`, `\n Agent Address: ${process.env.AGENTADDRESS}`));

//Send all Cloud Agent Webhooks posting to the agent webhook router
app.use('/api/controller-webhook', agentWebhookRouter);


app.use('/second-controller', (req, res) => {
	console.log("Second ACAPy Webhook Message");
	res.status(200).send()
})

app.use('/', (req, res) => {
	console.log("Requested outside of normal paths", req.url);
	console.log(req.body);
	res.status(404).send()
})