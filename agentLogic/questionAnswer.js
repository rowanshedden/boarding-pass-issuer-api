const AdminAPI = require('../adminAPI')
const Presentations = require('./presentations')

// Perform Agent Business Logic

// Retrieve Credential Definition IDs
const askQuestion = async (
    connection_id,
    question_text,
    question_detail,
    valid_responses
) => {
    try {
        const answer = await AdminAPI.QuestionAnswer.sendQuestion(
            connection_id,
            question_text,
            question_detail,
            valid_responses
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
        case 'Vaccination + PCR Test':
            console.log('Connection Request Vaccination + PCR Test')

            // (eldersonar) TODO: tie this to the governance
            // Presentations.requestPresentation(connectionMessage.connection_id, 'Vaccine')
            break

        case 'PCR Test Only':
            console.log('Connection Request PCR Test Only')

            // (eldersonar) TODO: tie this to the governance
            // Presentations.requestPresentation(connectionMessage.connection_id, 'Result')
            break

        default:
            console.warn('Answer Message:', message.response)
            return
    }
}

module.exports = {
    askQuestion,
    adminMessage
}