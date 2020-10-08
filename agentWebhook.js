const Websockets = require('./websockets.js')

const express = require('express')
const router = express.Router()

router.post('/topic/connections', async (req, res, next) => {
  console.log('Aries Cloud Agent Webhook Message----Connection------')

  console.log('Connection Details:')
  const connectionMessage = req.body
  console.log(connectionMessage)

  res.status(200).send('Ok')

  //Temporary Implementation, Should move to using Agent logic for storage and websocket broadcasting
  if (connectionMessage.state != 'invitation') {
    try {
      Websockets.sendMessageToAll('CONTACT', {connectionMessage})
    } catch (error) {
      console.error(error)
    }
  }
})

router.post('/topic/issue_credential', async (req, res, next) => {
  console.log('Aries Cloud Agent Webhook Message----Credential Issuance------')

  console.log('Issuance Details:')
  const issuanceMessage = req.body
  console.log(issuanceMessage)

  res.status(200).send('Ok')

  //Temporary Implementation, Should move to using Agent logic for storage and websocket broadcasting
  if (issuanceMessage.role === 'issuer') {
    try {
      Websockets.sendMessageToAll('CREDENTIAL', {issuanceMessage})
    } catch (error) {
      console.error(error)
    }
  }
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
