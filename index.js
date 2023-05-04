require('dotenv').config()
const axios = require('axios')
const bodyParser = require('body-parser')
const {DateTime} = require('luxon')
const express = require('express')
const http = require('http')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const Sequelize = require('sequelize')
const session = require('express-session')
const {v4: uuid} = require('uuid')

const Util = require('./util')

// Initalize sequelize with session store
const SequelizeStore = require('connect-session-sequelize')(session.Store)

// Import environment variables for use via an .env file in a non-containerized context
const dotenv = require('dotenv')
dotenv.config()

let app = express()
let server = http.createServer(app)
module.exports.server = server

// Websockets required to make APIs work and avoid circular dependency
let Websocket = require('./websockets.js')

const Credentials = require('./agentLogic/credentials')
const Images = require('./agentLogic/images')
const Settings = require('./agentLogic/settings')
const {getOrganization} = require('./agentLogic/settings')
const Passenger = require('./agentLogic/passenger')
const Presentations = require('./agentLogic/presentations')
const Users = require('./agentLogic/users')
const Verifications = require('./agentLogic/verifications')

app.use(bodyParser.urlencoded({extended: false}))
app.use(process.env.API_REQUEST_LIMIT ? bodyParser.json(process.env.API_REQUEST_LIMIT) : bodyParser.json());

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

app.use('/favicon.ico', async (req, res) => {
  console.log('Favicon route')
  const favicon = await Images.getImageByName('favicon.ico')
  const base64Image = Util.decodeBase64(favicon[0].dataValues.image)
  const buffer = Buffer.from(base64Image.split(',')[1], 'base64')
  res.contentType('image/x-icon')
  res.status(200).send(buffer)
})

app.use('/icon192.png', async (req, res) => {
  console.log('Icon192 route')
  const icon192 = await Images.getImageByName('icon192.png')
  const base64Image = Util.decodeBase64(icon192[0].dataValues.image)
  const buffer = Buffer.from(base64Image.split(',')[1], 'base64')
  res.contentType('image/png')
  res.status(200).send(buffer)
})

app.use('/icon512.png', async (req, res) => {
  console.log('Icon512 route')
  const icon512 = await Images.getImageByName('icon512.png')
  const base64Image = Util.decodeBase64(icon512[0].dataValues.image)
  const buffer = Buffer.from(base64Image.split(',')[1], 'base64')
  res.contentType('image/png')
  res.status(200).send(buffer)
})

app.use('/manifest.json', async (req, res) => {
  console.log('Manifest route')
  const manifest = await Settings.getManifest()
  res.status(200).send(manifest)
})

// Invitation request API
const Invitations = require('./agentLogic/invitations')
const Connections = require('./orm/connections')
const {Verification} = require('./orm/verifications')

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

app.use(
  '/api/vaccine-presentation-exchange',
  express.static('vaccine-presentation-exchange.json'),
)
//------------ (eldersonar) TODO: remove after trial-------------

// (eldersonar) Create database
const sequelize = new Sequelize(
  process.env.DB,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    dialectOptions: {
      ssl: true,
    },
  },
)

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
  if (!req.body.username || !req.body.password) {
    res.json({error: 'All fields must be filled out.'})
  } else if (!Util.validateAlphaNumeric(req.body.username)) {
    res.json({
      error: 'Username or password is wrong.',
    })
  } else if (!Util.validatePassword(req.body.password)) {
    res.json({
      error: 'Username or password is wrong.',
    })
  } else if (!req.body.password || !req.body.username) {
    res.json({error: 'All fields must be filled out.'})
  } else {
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
  }
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
    jwt.verify(req.body.token, process.env.JWT_SECRET)

    const unusedtoken = await Users.getUserByToken(req.body.token)
    if (!unusedtoken) {
      res.json({error: 'The link has expired.'})
    } else {
      res.status(200).json({status: 'The link is valid.'})
    }
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
      error: 'Password must be at least 15 characters.',
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
    if (!req.body.email || !req.body.username || !req.body.password) {
      res.json({error: 'All fields must be filled out.'})
    } else if (!Util.validateEmail(req.body.email)) {
      res.json({error: 'Must be a valid email.'})
    } else if (!Util.validateAlphaNumeric(req.body.username)) {
      res.json({
        error: 'Username must be least 3 characters long',
      })
    } else if (!Util.validatePassword(req.body.password)) {
      res.json({
        error: 'Password must be at least 15 characters.',
      })
    } else {
      userByEmail = await Users.getUserByEmail(req.body.email)
      if (!userByEmail) {
        res.json({error: 'The user was not found.'})
      } else {
        user = await Users.updateUser(
          userByEmail.user_id,
          req.body.username,
          req.body.email,
          req.body.password,
          req.body.token,
          null,
          req.body.flag,
        )

        if (!user) {
          res.json({error: "The user couldn't be updated."})
        } else if (user.error) {
          res.send(user.error)
        } else {
          res.status(200).json({status: 'User updated.'})
        }
      }
    }
  } else {
    // updating the token for the user (from password forgot screen)

    // Empty/data checks
    if (!req.body.email) {
      res.json({error: 'All fields must be filled out.'})
    } else if (!Util.validateEmail(req.body.email)) {
      res.json({error: 'Must be a valid email.'})
    } else {
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

      if (user.error) {
        res.send(user.error)
      } else if (!user) {
        res.json({error: "The user couldn't be updated."})
      } else {
        res.status(200).json({status: 'User updated.'})
      }
    }
  }

  // If SMTP is not set up or broken
  if (user.error) res.send(user)

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
  if (req.header('x-api-key') === process.env.APIKEY) {
    next()
  } else {
    res.sendStatus(401)
  }
}

// Invitation request API
app.post('/api/invitations', checkApiKey, async (req, res) => {
  console.log(req.body)
  const data = req.body
  try {
    if (data.invitation_type === 'OOB') {
      console.log('OOB invitation workflow')
      const oob = await Invitations.createOutOfBandInvitation(
        data.contact_id,
        data.handshake_protocol,
        data.alias,
        data.invitation_mode,
        data.accept,
        data.public,
        data.invitation_role,
        data.invitation_label,
        data.invitation_status,
        data.invitation_description,
        data.invitation_active_starting_at,
        data.invitation_active_ending_at,
        data.uses_allowed ? data.uses_allowed : '',
      )

      const connectionInterval = setInterval(async () => {
        const invByOOB = await Invitations.getInvitationByOOBId(
          oob.oobInv.oob_id,
        )

        if (invByOOB) {
          clearInterval(connectionInterval)
          res.status(200).json({
            invitation_url: invByOOB.invitation_url,
            invitation_id: invByOOB.invitation_id,
            contact_id: invByOOB.contact_id,
          })
        }
      }, 1500)
    } else {
      console.log('CV1 invitation workflow')
      const invitation = await Invitations.createInvitation(
        data.contact_id,
        data.alias,
        data.invitation_mode,
        data.accept,
        data.public,
        data.invitation_role,
        data.invitation_label,
        data.invitation_status,
        data.invitation_description,
        data.invitation_active_starting_at,
        data.invitation_active_ending_at,
        data.uses_allowed ? data.uses_allowed : '',
      )

      res.status(200).json({
        invitation_url: invitation.newInv.invitation_url,
        invitation_id: invitation.newInv.invitation_id,
        contact_id: invitation.newInv.contact_id,
      })
    }
  } catch (error) {
    console.error(error)
    res.json({error: 'There was a problem creating an invitation'})
  }
})

app.post('/api/verifications', checkApiKey, async (req, res) => {
  try {
    const data = req.body

    if (!data.invitation_id && !data.contact_id) {
      res.status(400).send({
        message: 'No invitation_id or contact_id was provided on the request.',
      })
    }

    const verification = await Verifications.verify(data)
    res.status(200).send(verification)
  } catch (error) {
    console.error(error)
    res.json({error: 'Unexpected error occurred'})
  }
})

app.get('/api/verifications/:id', checkApiKey, async (req, res) => {
  try {
    const verification = await Verifications.retrieve(req.params.id)

    res.status(200).json(verification)
  } catch (error) {
    console.error(error)
    res.json({error: 'There was a problem retrieving a verification'})
  }
})

// Credential request API
app.post('/api/credentials', checkApiKey, async (req, res) => {
  try {
    const data = req.body

    if (!data.invitation_id && !data.contact_id) {
      res.status(400).send({
        message: 'No invitation_id or contact_id was provided on the request.',
      })
    }

    const invitation = await Invitations.getInvitation(data.invitation_id)

    if (!invitation) {
      res.status(400).send({
        message: `The invitation (${data.invitation_id}) could not be found.`,
      })
    }

    const schemaParts = data.schema_id.split(':')
    const newCredential = {
      connectionID: invitation.connection_id,
      schemaID: data.schema_id,
      schemaVersion: schemaParts[3],
      schemaName: schemaParts[2],
      schemaIssuerDID: schemaParts[0],
      comment: '',
      attributes: data.attributes,
    }

    await Credentials.autoIssueCredential(
      newCredential.connectionID,
      undefined,
      undefined,
      newCredential.schemaID,
      newCredential.schemaVersion,
      newCredential.schemaName,
      newCredential.schemaIssuerDID,
      newCredential.comment,
      newCredential.attributes,
    )

    res.status(200).send({success: 'Credential successfully offered.'})
  } catch (error) {
    console.error(error)
    res.json({
      error: "Unexpected error occurred, couldn't issue credential",
    })
  }
})
app.post('/api/trusted-traveler', checkApiKey, async (req, res) => {
  console.log(req.body)
  const data = req.body

  try {
    let credentialAttributes = [
      {
        name: 'traveler_email',
        value: data.attributes.traveler_email || '',
      },
      {
        name: 'credential_issue_date',
        value: data.attributes.credential_issue_date || '',
      },
      {
        name: 'credential_issuer_name',
        value: data.attributes.credential_issuer_name || '',
      },
      {
        name: 'traveler_date_of_birth',
        value: data.attributes.traveler_date_of_birth || '',
      },
      {
        name: 'traveler_gender_legal',
        value: data.attributes.traveler_gender_legal || '',
      },
      {
        name: 'governance_applied',
        value: data.attributes.governance_applied || '',
      },
      {
        name: 'trusted_traveler_issue_date_time',
        value: data.attributes.trusted_traveler_issue_date_time || '',
      },
      {
        name: 'traveler_origin_country',
        value: data.attributes.traveler_origin_country || '',
      },
      {
        name: 'traveler_given_names',
        value: data.attributes.traveler_given_names || '',
      },
      {
        name: 'trusted_traveler_expiration_date_time',
        value: data.attributes.trusted_traveler_expiration_date_time || '',
      },
      {
        name: 'traveler_surnames',
        value: data.attributes.traveler_surnames || '',
      },
      {
        name: 'traveler_country',
        value: data.attributes.traveler_country || '',
      },
      {
        name: 'trusted_traveler_id',
        value: data.attributes.trusted_traveler_id || '',
      },
    ]

    const schema_id = process.env.SCHEMA_TRUSTED_TRAVELER

    let newCredential = {
      connectionID: data.connection_id,
      schemaID: schema_id,
      schemaVersion: schema_id.split(':')[3],
      schemaName: schema_id.split(':')[2],
      schemaIssuerDID: schema_id.split(':')[0],
      comment: '',
      attributes: credentialAttributes,
    }

    await Credentials.autoIssueCredential(
      newCredential.connectionID,
      undefined,
      undefined,
      newCredential.schemaID,
      newCredential.schemaVersion,
      newCredential.schemaName,
      newCredential.schemaIssuerDID,
      newCredential.comment,
      newCredential.attributes,
    )

    const response = {success: 'Trusted Traveler issued'}
    res.status(200).send(response)
  } catch (error) {
    console.error(error)
    res.json({
      error:
        "Unexpected error occurred, couldn't issue Trusted Traveler Credential",
    })
  }
})

app.use('/', (req, res) => {
  console.log('Request outside of normal paths', req.url)
  console.log(req.body)
  res.status(404).send()
})
