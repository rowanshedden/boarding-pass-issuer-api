const AdminAPI = require('../adminAPI')
const Presentations = require('./presentations')

// Perform Agent Business Logic

// Retrieve Credential Definition IDs
const askQuestion = async (
  connection_id,
  question_text,
  question_detail,
  valid_responses,
) => {
  try {
    const answer = await AdminAPI.QuestionAnswer.sendQuestion(
      connection_id,
      question_text,
      question_detail,
      valid_responses,
    )

    return answer
  } catch (error) {
    console.error('Error Sending a Question')
    throw error
  }
}

const adminMessage = async (message) => {
  console.log('New Q&A Message')

  console.log(message)

  // Connection Reuse Method
  switch (message.response) {
    case 'Vaccination':
      console.log('Connection Request Vaccination')

      // (eldersonar) TODO: tie this to the governance

      await AdminAPI.Connections.sendBasicMessage(message.connection_id, {
        content: 'Please, provide your first vaccination credential',
      })

      setTimeout(() => {
        Presentations.requestPresentation(message.connection_id, 'Vaccination')
      }, 1000)
      break

    case 'Lab Result':
      console.log('Connection Request Lab Result')

      // (eldersonar) TODO: tie this to the governance
      setTimeout(() => {
        Presentations.requestPresentation(message.connection_id, 'Lab')
      }, 1000)
      break

    default:
      console.warn('Answer Message:', message.response)
      return
  }
}

module.exports = {
  askQuestion,
  adminMessage,
}
