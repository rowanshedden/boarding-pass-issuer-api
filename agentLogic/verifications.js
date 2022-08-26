import Verifications from '../orm/verifications.js'

const createVerification = async (
  verification_id,
  // processor_id
  // merchant_id
  connection_id,
  user_id,
  invitation_id,
  // connection_state
  schema_id,
  schema_attributes,
  timeout,
  rules,
  meta_data,
  complete,
  results,
  result_string,
  result_data,
  // proof_state
  presentation_exchange_id,
  error,
  // result
  created_at,
  updated_at,
) => {
  try {
    const verification = await Verifications.createVerificationRecord(
      verification_id,
      // processor_id
      // merchant_id
      connection_id,
      user_id,
      invitation_id,
      // connection_state
      schema_id,
      schema_attributes,
      timeout,
      rules,
      meta_data,
      complete,
      results,
      result_string,
      result_data,
      // proof_state
      presentation_exchange_id,
      error,
      // result
      created_at,
      updated_at,
    )
  } catch (error) {
    console.error('Could not create verification', error)
  }
}

const getVerification = async (verification_id) => {
  try {
    const verification = await Verifications.readVerifications(verification_id)
    return verification
  } catch (error) {
    console.error('Could not retrieve verification record', error)
  }
}

module.exports = {
  createVerification,
  getVerification,
}
