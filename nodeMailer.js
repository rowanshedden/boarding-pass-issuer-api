require('dotenv').config()
const nodemailer = require('nodemailer')
const Settings = require('./agentLogic/settings')
const Util = require('./util')

let currentSMTP = {}

async function emailService() {
  currentSMTP = await Settings.getSMTP()

  const decryptedPassword = Util.decrypt(
    currentSMTP.dataValues.value.auth.pass,
    currentSMTP.dataValues.value.IV,
  )

  const transporter = nodemailer.createTransport({
    host: currentSMTP.dataValues.value.host,
    // (eldersonar) Defaults to 587 if "secure" is false or no value provided or 465 if true
    port:
      currentSMTP.dataValues.value.encryption === false
        ? 587
        : !currentSMTP.dataValues.value.encryption
        ? 587
        : currentSMTP.dataValues.value.encryption,
    // (eldersonar) False for STARTTLS (must use port 587), true for TLS (must use port 465)
    secure: !currentSMTP.dataValues.value.encryption
      ? false
      : currentSMTP.dataValues.value.encryption,
    auth: {
      user: currentSMTP.dataValues.value.auth.mailUsername
        ? currentSMTP.dataValues.value.auth.mailUsername
        : currentSMTP.dataValues.value.auth.email,
      pass: decryptedPassword,
    },
    tls: {
      // (eldersonar) Change to "false" to not fail on invalid certs
      rejectUnauthorized: true,
    },
  })

  return transporter
}

const sendMail = async (message) => {
  const transporter = await emailService()

  return new Promise((resolve, reject) => {
    transporter.sendMail(message, (error, info) => {
      if (error) {
        console.log('Error occurred')
        console.log(error.message)
        reject('error')
      } else {
        console.log('Message sent successfully!')
        console.log(nodemailer.getTestMessageUrl(info))
        resolve(true)
      }
      // Only needed when using pooled connections
      transporter.close()
    })
  })
}

module.exports = {
  emailService,
  sendMail,
}
