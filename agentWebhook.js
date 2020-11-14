const Websockets = require('./websockets.js')

const express = require('express')
const router = express.Router()

const Contacts = require('./agentLogic/contacts.js')
const Credentials = require('./agentLogic/credentials.js')
const BasicMessages = require('./agentLogic/basicMessages.js')
const Presentations = require('./agentLogic/presentations.js')

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
  const presMessage = req.body
  console.log(presMessage)

  res.status(200).send('Ok')
  Presentations.adminMessage(presMessage)
})

router.post('/topic/basicmessages', async (req, res, next) => {
  console.log('Aries Cloud Agent Webhook Message----Basic Message------')

  console.log('Message Details:')
  const basicMessage = req.body
  console.log(basicMessage)

  res.status(200).send('Ok')

  BasicMessages.adminMessage(basicMessage)
})

module.exports = router
