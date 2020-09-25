const express = require('express');
const router = express.Router();

router.post('/topic/connections', async (req, res, next) => {
	console.log("Aries Cloud Agent Webhook Message----Connection------");

	console.log("Connection Details:");
	console.log(req.body);
	
	res.status(200).send('Ok');

})

router.post('/topic/issue_credential', async (req, res, next) => {
	console.log("Aries Cloud Agent Webhook Message----Credential Issuance------");

	console.log("Issuance Details:");
	console.log(req.body);
	
	res.status(200).send('Ok');

})

router.post('/topic/present_proof', async (req, res, next) => {
	console.log("Aries Cloud Agent Webhook Message----Presentations------");

	console.log("Presentation Details:");
	console.log(req.body);
	
	res.status(200).send('Ok');

})

router.post('/topic/basicmessages', async (req, res, next) => {
	console.log("Aries Cloud Agent Webhook Message----Basic Message------");

	console.log("Message Details:");
	console.log(req.body);
	
	res.status(200).send('Ok');

})

module.exports = router;