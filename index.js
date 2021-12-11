require('dotenv').config()
const axios = require('axios')
const bodyParser = require('body-parser')
const express = require('express')
const http = require('http')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const session = require('express-session')
const Util = require('./util')

const Sequelize = require('sequelize')
// initalize sequelize with session store
const SequelizeStore = require('connect-session-sequelize')(session.Store)

const Contacts = require('./orm/contacts')
const ContactsCompiled = require('./orm/contactsCompiled')

const Images = require('./agentLogic/images')

// Import environment variables for use via an .env file in a non-containerized context
const dotenv = require('dotenv')
dotenv.config()

let app = express()
let server = http.createServer(app)

module.exports.server = server

// Websockets required to make APIs work and avoid circular dependency
let Websocket = require('./websockets.js')

const Passenger = require('./agentLogic/passenger')
const Users = require('./agentLogic/users')

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(passport.initialize())
require('./passport-config')(passport)

server.listen(process.env.CONTROLLERPORT || 3100, () =>
  console.log(
    `Server listening at http://localhost:${
      process.env.CONTROLLERPORT || 3100
    }`,
    `\n Agent Address: ${process.env.AGENTADDRESS || 'localhost:8150'}`,
  ),
)

const agentWebhookRouter = require('./agentWebhook')
const {connect} = require('http2')

// Send all cloud agent webhooks posting to the agent webhook router
app.use('/api/controller-webhook', agentWebhookRouter)

// Present only in development to catch the secondary agent webhooks for ease of development
app.use('/api/second-controller', (req, res) => {
  console.log('Second ACA-Py Agent Webhook Message')
  res.status(200).send()
})

app.use(
  '/api/governance-framework',
  express.static('governance-framework.json'),
)

// Invitation request API
const Invitations = require('./agentLogic/invitations')
const Connections = require('./orm/connections')

app.use(
  '/api/presentation-exchange',
  express.static('presentation-exchange-nested.json'),
  // express.static('presentation-exchange.json'),
)

//------------ (eldersonar) TODO: remove after trial-------------
app.use(
  '/api/lab-presentation-exchange',
  express.static('lab-presentation-exchange.json'),
)
app.use(
  '/api/lab-vaccine-presentation-exchange',
  express.static('lab-vaccine-presentation-exchange.json'),
)
//------------ (eldersonar) TODO: remove after trial-------------

// (eldersonar) Create database
const sequelize = new Sequelize('government', 'government', 'government', {
  host: 'government-db',
  dialect: 'postgres',
})

const myStore = new SequelizeStore({
  db: sequelize,
  tableName: 'sessions',
  checkExpirationInterval: 15 * 60 * 1000, // Storage auto cleanup
})

let sess = {
  secret: process.env.SESSION_SECRET,
  store: myStore,
  cookie: {
    maxAge: 3600 * 1000,
    httpOnly: false,
    // sameSite: 'strict' // Not enabled due to browser support; TODO: Check again after June 1, 2022
  },
  name: 'sessionId',
  resave: false, // Touch is enabled via SequelizeStore
  rolling: true, // Force the session identifier cookie to be set on every response.
  saveUninitialized: false,
}

// Use secure cookies in production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sess.proxy = true // The "X-Forwarded-Proto" header will be used
  sess.cookie.secure = true // serve secure cookies
}

app.use(session(sess))

function parseCookies(request) {
  var list = {},
    rc = request.headers.cookie

  rc &&
    rc.split(';').forEach(function (cookie) {
      var parts = cookie.split('=')
      list[parts.shift().trim()] = decodeURI(parts.join('='))
    })

  return list
}

app.use(passport.session())

// (eldersonar) Session validation middleware
const verifySession = (req, res, next) => {
  const cookies = parseCookies(req)

  if (cookies.sessionId) {
    let sessionId = cookies.sessionId.split('.')[0]
    sessionId = sessionId.split('s%3A')[1]

    if (sessionId === req.sessionID) {
      // console.log('100% session ID match')
      next()
    } else {
      console.log('Unauthorized')
      res.redirect(401, '/')
    }
  } else {
    res.redirect(401, '/')
  }
}

// Authentication
app.post('/api/user/log-in', (req, res, next) => {
  // Empty/data checks
  if (!req.body.username || !req.body.password)
    res.json({error: 'All fields must be filled out.'})

  if (!Util.validateAlphaNumeric(req.body.username))
    res.json({
      error:
        'Username must be at least 3 character long and consist of alphanumeric values.',
    })

  if (!Util.validatePassword(req.body.password))
    res.json({
      error:
        'Must be at least: 1 digit, 1 lowercase, 1 uppercase, 1 special characters, 8 characters.',
    })

  if (!req.body.password || !req.body.username)
    res.json({error: 'All fields must be filled out.'})
  passport.authenticate('local', (err, user, info) => {
    if (err) throw err
    if (!user) res.json({error: 'Username or password is wrong.'})
    else {
      req.logIn(user, (err) => {
        if (err) throw err

        // Put roles in the array
        const userRoles = []
        req.user.Roles.forEach((element) => userRoles.push(element.role_name))

        res.json({
          id: req.user.user_id,
          username: req.user.username,
          roles: userRoles,
        })
      })
    }
  })(req, res, next)
})

// Logging out
app.post('/api/user/log-out', (req, res) => {
  // Destory the session record from the store
  myStore.destroy(req.sessionID, function () {
    // Destroy the session cookie
    req.session.destroy(function (err) {
      if (!err) {
        res
          .status(200)
          .clearCookie('sessionId', {path: '/'})
          .json({status: 'Session destroyed.'})
      } else {
        res.send("Couldn't destroy the session.")
      }
    })
  })
})

// Validate JWT
app.post('/api/user/token/validate', async (req, res) => {
  try {
    const verify = jwt.verify(req.body.token, process.env.JWT_SECRET)
    const unusedtoken = await Users.getUserByToken(req.body.token)
    if (!unusedtoken) res.json({error: 'The link has expired.'})
    else res.status(200).json({status: 'The link is valid.'})
  } catch (err) {
    console.error(err)
    res.json({error: 'The link has expired.'})
  }
})

app.post('/api/user/password/update', async (req, res) => {
  try {
    jwt.verify(req.body.token, process.env.JWT_SECRET)
  } catch (err) {
    console.error(err)
    console.log('The token has expired.')
    res.json({error: 'The link has expired.'})
  }

  let user = undefined

  if (!req.body.password)
    res.status(200).json({error: 'All fields must be filled out.'})
  else if (!Util.validatePassword(req.body.password)) {
    res.json({
      error:
        'Must be at least: 1 digit, 1 lowercase, 1 uppercase, 1 special characters, 8+ characters.',
    })
  } else {
    try {
      const validToken = await Users.getUserByToken(req.body.token)
      if (validToken.user_id !== req.body.id)
        res.json({error: 'The token did not match the user.'})
    } catch (error) {
      throw error
    }

    user = await Users.updatePassword(req.body.id, req.body.password)
    if (!user)
      res.status(200).json({error: "The password couldn't be updated."})
    else res.status(200).json({status: 'Password updated.'})
  }
})

app.post('/api/user/update', async (req, res) => {
  let userByEmail = undefined
  let user = undefined
  if (req.body.flag && req.body.flag === 'set-up user') {
    // Updating the user during the user setup process

    // Check for the valid token
    try {
      const verify = jwt.verify(req.body.token, process.env.JWT_SECRET)
    } catch (error) {
      res.json({error: 'The link has expired.'})
      throw error
    }

    // Empty/data checks
    if (!req.body.email || !req.body.username || !req.body.password)
      res.json({error: 'All fields must be filled out.'})

    if (!Util.validateEmail(req.body.email))
      res.json({error: 'Must be a valid email.'})

    if (!Util.validateAlphaNumeric(req.body.username))
      res.json({
        error:
          'Username must be at least 3 character long and consist of alphanumeric values.',
      })

    if (!Util.validatePassword(req.body.password))
      res.json({
        error:
          'Must be at least: 1 digit, 1 lowercase, 1 uppercase, 1 special characters, 8 characters.',
      })

    userByEmail = await Users.getUserByEmail(req.body.email)
    if (!userByEmail) res.json({error: 'The user was not found.'})

    user = await Users.updateUser(
      userByEmail.user_id,
      req.body.username,
      req.body.email,
      req.body.password,
      req.body.token,
      null,
      req.body.flag,
    )
  } else {
    // updating the token for the user (from password forgot screen)

    // Empty/data checks
    if (!req.body.email) res.json({error: 'All fields must be filled out.'})

    if (!Util.validateEmail(req.body.email))
      res.json({error: 'Must be a valid email.'})

    userByEmail = await Users.getUserByEmail(req.body.email)
    if (!userByEmail) res.json({error: 'The user was not found.'})
    user = await Users.updateUser(
      userByEmail.user_id,
      userByEmail.username,
      userByEmail.email,
      userByEmail.password,
      null,
      null,
      req.body.flag,
    )
  }

  // If SMTP is not set up or broken
  if (user.error) res.send(user.error)

  if (!user) res.json({error: "The user couldn't be updated."})
  else res.status(200).json({status: 'User updated.'})
})

// Logo retrieval
app.get('/api/logo', async (req, res) => {
  try {
    const logo = await Images.getImagesByType('logo')
    if (!logo) res.json({error: 'The logo was not found.'})
    res.send(logo)
  } catch (err) {
    console.error(err)
  }
})

// Session expiration reset
app.get('/api/renew-session', verifySession, async (req, res) => {
  const user = await Users.getUser(req.session.passport.user)

  // Put roles in the array
  const userRoles = []
  user.Roles.forEach((element) => userRoles.push(element.role_name))

  res
    .status(200)
    .json({id: user.user_id, username: user.username, roles: userRoles})
})

const checkApiKey = function (req, res, next) {
  if (req.header('x-api-key') != process.env.APIKEY) {
    res.sendStatus(401)
  } else {
    next()
  }
}

// Invitation request API
app.post('/api/invitations', checkApiKey, async (req, res) => {
  console.log(req.body)
  const data = req.body
  try {
    // (eldersonar) Create invitation
    const invitation = await Invitations.createSingleUseInvitation()

    if (!invitation) {
      res.json({error: 'There was a problem creating an invitation'})
    }

    const fullName = data.passport_surnames + ' ' + data.passport_given_names

    let contact = null

    // (eldersonar) Create contact
    if (invitation) {
      contact = await Contacts.createContact(
        fullName, // label
        {}, // meta_data
      )
    }

    // (eldersonar) Link contact to connection
    const connections = await Connections.linkContactAndConnection(
      contact.contact_id,
      invitation.connection_id,
    )

    if (!connections) {
      res.json({error: "Couldn't link contacts to connections"})
    }

    // (eldersonar) Write traveler and passport to the database
    const passenger = await Passenger.addTravelerAndPassport(
      contact.contact_id,
      data,
    )

    if (!passenger) {
      res.json({
        error:
          "Couldn't write passenger information to the government database",
      })
    }

    // (eldersonar) Assamble response object for SITA Health Hub database
    const SITAHubTraveler = {
      xid: invitation.connection_id,
      travellerDetails: {
        dateOfBirth: data.passport_date_of_birth,
        familyName: data.passport_surnames,
        givenNames: data.passport_given_names,
        nationality: data.passport_nationality,
        sex: data.passport_gender_legal,
        travelDocumentDetails: [
          {
            issuingState: data.passport_authority,
            number: data.passport_number,
            type: data.passport_type,
          },
        ],
      },
      travelItinerary: {
        carrierCode: '',
        carrierType: 'A',
        pnrNumber: '',
        routeDetails: [
          {
            arrival: {
              countryCode: data.arrival_destination_country_code,
              dateTime: data.arrival_date,
              portCode: data.arrival_destination_port_code,
            },
            departure: {
              countryCode: data.departure_destination_country_code,
              dateTime: data.departure_date,
              portCode: data.departure_destination_port_code,
            },
          },
        ],
        serviceNumber: '',
      },
    }

    // (eldersonar) Posting to the SITA HEALTH HUB database
    await axios({
      method: 'POST',
      url: 'https://health-provider.sitalab.io/api/v1.0/provider/xid',
      headers: {'x-apikey': process.env.SITA_APIKEY},
      data: SITAHubTraveler,
    })
      .then((response) => {
        // (eldersonar) Success
        res.status(200).json({
          connection_id: invitation.connection_id,
          invitation_url: invitation.invitation_url,
        })
      })
      .catch(function (error) {
        // (eldersonar) Wait for 30 seconds and try again
        setTimeout(async () => {
          const secondResponse = await axios({
            method: 'POST',
            url: 'https://health-provider.sitalab.io/api/v1.0/provider/xid',
            headers: {'x-apikey': process.env.SITA_APIKEY},
            data: SITAHubTraveler,
          })
            .then((response2) => {
              // (eldersonar) Success
              res.status(200).json({
                connection_id: invitation.connection_id,
                invitation_url: invitation.invitation_url,
              })
            })
            .catch(function (error) {
              res.send({error: "Couldn't write to the SITA HUB database"})
            })
        }, 30000)
      })
  } catch (error) {
    console.error(error)
    res.json({error: 'Unexpected error occurred'})
  }
})

// Get verification status by connection_id
app.get('/api/verification/:id', async (req, res) => {
  try {
    console.log(req.params.id)

    const contact = await ContactsCompiled.readContactByConnection(
      req.params.id,
      ['Traveler'],
    )

    // (eldersonar) TODO: Remove after development
    console.log('')
    console.log('')
    console.log(contact.Traveler.dataValues.proof_result_list)
    console.log(contact.Traveler.dataValues.proof_result_list.presentations)
    console.log('')
    console.log('')
    // (eldersonar) TODO: Remove after development

    if (!contact) {
      res.json({error: "Couldn't find contact by connection id"})
    }

    let complete = null
    let result = contact.Traveler.dataValues.verification_status
    let result_string = null
    let error = null

    // Set complete status, error and result string
    if (result === false || result === true) {
      complete = true

      if (result) {
        result_string = 'Traveler was approved.'
      } else {
        result_string = 'Traveler was not approved.'
      }
    } else {
      complete = false

      if (contact.Connections[0].error_msg)
        error = contact.Connections[0].error_msg
    }

    const response = {
      id: contact.Traveler.dataValues.contact_id,
      schema_id: process.env.SCHEMA_TRUSTED_TRAVELER,
      complete,
      result,
      result_string,
      data: {},
      connection_status: contact.Connections[0].state,
      connection_id: contact.Connections[0].connection_id,
      proof_status: contact.Traveler.dataValues.proof_status,
      rule: '',
      error,
    }

    res.status(200).send(response)
  } catch (err) {
    console.error(err)
    res.json({error: "Passenger couldn't be verified"})
  }
})

app.use('/', (req, res) => {
  console.log('Request outside of normal paths', req.url)
  console.log(req.body)
  res.status(404).send()
})
