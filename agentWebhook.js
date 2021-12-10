const Websockets = require('./websockets')

const express = require('express')
const router = express.Router()

const Contacts = require('./agentLogic/contacts')
const Credentials = require('./agentLogic/credentials')
const Passports = require('./agentLogic/passports')
const BasicMessages = require('./agentLogic/basicMessages')
const Governance = require('./agentLogic/governance')
const Presentations = require('./agentLogic/presentations')
const QuestionAnswer = require('./agentLogic/questionAnswer')

router.post('/topic/connections', async (req, res, next) => {
  console.log('Aries Cloud Agent Webhook Message----Connection------')

  // --------- (eldersonar) This code allows dynamically create answer options from presentation definition file (if we rely on a single one) ------------
  // const pdf = await Governance.getPresentationDefinition()
  // let answerOptions = []
  // let answers = []

  // if (pdf) {
  //   if (!pdf.presentation_definition.submission_requirements[0].hasOwnProperty('from_nested')) {

  //     console.log("I'm in nested")
  //     for (let i = 0; i < pdf.presentation_definition.submission_requirements[0].from_nested.length; i++) {
  //       answerOptions.push(pdf.presentation_definition.submission_requirements[0].from_nested[i].from)
  //     }

  //   } else {
  //     console.log("I'm in regular")

  //     for (let j = 0; j < pdf.presentation_definition.input_descriptors.length; j++) {
  //       answerOptions.push(pdf.presentation_definition.input_descriptors[j].name)
  //     }
  //   }

  //   console.log("answerOptions is ")
  //   console.log(answerOptions)
  //   console.log("")

  //   for (let k = 0; k < answerOptions.length; k++) {
  //     answers.push({ "text": answerOptions[k] })
  //     console.log("answers are")
  //     console.log(answers)
  //     console.log("")
  //   }
  // } else {
  //   console.log("no pdf for you")
  // }

  // console.log(answers)

  console.log('Connection Details:')
  const connectionMessage = req.body
  console.log(connectionMessage)

  res.status(200).send('Ok')

  // (eldersonar) Send a proof request to the established connection
  if (connectionMessage.state === 'active') {
    QuestionAnswer.askQuestion(
      connectionMessage.connection_id,
      "How would you like to share your health status?",
      "Please select a credential option below:",
      [
        { "text": "Vaccination + PCR Test" },
        { "text": "PCR Test Only" }
      ]
      // answers
    )

    answerOptions = []
    answers = []
  }

  await Contacts.adminMessage(connectionMessage)
})

router.post('/topic/issue_credential', async (req, res, next) => {
  console.log('Aries Cloud Agent Webhook Message----Credential Issuance------')

  console.log('Issuance Details:')
  const issuanceMessage = req.body
  console.log(issuanceMessage)

  res.status(200).send('Ok')

  await Credentials.adminMessage(issuanceMessage)
})

router.post('/topic/present_proof', async (req, res, next) => {
  console.log('Aries Cloud Agent Webhook Message----Presentations------')

  console.log('Presentation Details:')
  const presMessage = req.body
  console.log(presMessage)

  res.status(200).send('Ok')
  await Presentations.adminMessage(presMessage)
})

router.post('/topic/basicmessages', async (req, res, next) => {
  console.log('Aries Cloud Agent Webhook Message----Basic Message------')

  console.log('Message Details:')
  const basicMessage = req.body
  console.log(basicMessage)

  res.status(200).send('Ok')

  await BasicMessages.adminMessage(basicMessage)
})

router.post('/topic/data-transfer', async (req, res, next) => {
  console.log('Aries Cloud Agent Webhook Message----Data Transfer------')

  console.warn('No Goal Code Found')

  res.status(200).send('Ok')
})

// (eldersonar) Not used
// router.post('/topic/data-transfer/:goalCode', async (req, res, next) => {
//   console.log(
//     'Aries Cloud Agent Webhook Message----Data Transfer goalCode------',
//   )

//   console.log('Message Details:', req.params.goalCode)
//   if (req.params.goalCode === 'transfer.demographicdata') {
//     let connection_id = req.body.connection_id
//     let data = req.body.data[0].data.json

//     let contact = await Contacts.getContactByConnection(connection_id, [])

//     Demographics.updateOrCreateDemographic(
//       contact.contact_id,
//       data.email,
//       data.phone,
//       data.address,
//     )
//   } else if (req.params.goalCode === 'transfer.passportdata') {
//     let connection_id = req.body.connection_id
//     let data = req.body.data[0].data.json

//     let contact = await Contacts.getContactByConnection(connection_id, [])

//     Passports.updateOrCreatePassport(
//       contact.contact_id,
//       data.passport_number,
//       data.surname,
//       data.given_names,
//       data.sex,
//       data.date_of_birth,
//       data.place_of_birth,
//       data.nationality,
//       data.date_of_issue,
//       data.date_of_expiration,
//       data.type,
//       data.code,
//       data.authority,
//       data.photo,
//     )
//   } else {
//   }

//   res.status(200).send('Ok')
// })

router.post('/topic/questionanswer', async (req, res, next) => {
  console.log('Aries Cloud Agent Webhook Message----Q&A Answer------')

  console.log('Message Details:')
  const answer = req.body
  console.log(answer)

  res.status(200).send('Ok')

  if (answer.state === "answered") {
    await QuestionAnswer.adminMessage(answer)
  }

})

module.exports = router
