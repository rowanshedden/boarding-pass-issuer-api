const express = require('express')
const http = require('http')
const bodyParser = require('body-parser')

//Import Environment Variables for use via an .env file in a non-containerized context
const dotenv = require('dotenv')
dotenv.config()

let app = express()
let server = http.createServer(app)

module.exports.server = server
let Websocket = require('./websockets.js')

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

server.listen(process.env.CONTROLLERPORT || 3100, () =>
  console.log(
    `Server listening at http://localhost:${
      process.env.CONTROLLERPORT || 3100
    }`,
    `\n Agent Address: ${process.env.AGENTADDRESS || 'localhost:8150'}`,
  ),
)

const agentWebhookRouter = require('./agentWebhook')

//Send all Cloud Agent Webhooks posting to the agent webhook router
app.use('/api/controller-webhook', agentWebhookRouter)

//Present only in development to catch the secondary agent webhooks for ease of development
app.use('/second-controller', (req, res) => {
  console.log('Second ACA-Py Agent Webhook Message')
  res.status(200).send()
})

app.use('/', (req, res) => {
  console.log('Request outside of normal paths', req.url)
  console.log(req.body)
  res.status(404).send()
})
