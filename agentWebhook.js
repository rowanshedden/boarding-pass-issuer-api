const Websockets = require('./websockets.js')

const express = require('express')
const router = express.Router()

const Contacts = require('./agentLogic/contacts.js')
const Credentials = require('./agentLogic/credentials.js')

router.post('/topic/connections', async (req, res, next) => {
  console.log('Aries Cloud Agent Webhook Message----Connection------')

  console.log('Connection Details:')
  const connectionMessage = req.body
  console.log(connectionMessage)

  res.status(200).send('Ok')

  Contacts.adminMessage(connectionMessage)
})

router.post('/topic/issue_credential', async (req, res, next) => {
  console.log('Aries Cloud Agent Webhook Message----Credential Issuance------')

  console.log('Issuance Details:')
  const issuanceMessage = req.body
  console.log(issuanceMessage)

  res.status(200).send('Ok')

  Credentials.adminMessage(issuanceMessage)
})

router.post('/topic/present_proof', async (req, res, next) => {
  console.log('Aries Cloud Agent Webhook Message----Presentations------')

  console.log('Presentation Details:')
  console.log(req.body)

  res.status(200).send('Ok')
})

router.post('/topic/basicmessages', async (req, res, next) => {
  console.log('Aries Cloud Agent Webhook Message----Basic Message------')

  console.log('Message Details:')
  console.log(req.body)

  res.status(200).send('Ok')
})

module.exports = router
