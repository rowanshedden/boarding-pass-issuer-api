//Utilities:
//Encode and decode Base64
const decodeBase64 = (encodedMessage) => {
  console.log('Decoding encoded Base64 message')
  return Buffer.from(encodedMessage, 'base64').toString('ascii')
}

const encodeBase64 = (message) => {
  console.log('Encoding message to Base64')
  return Buffer.from(message).toString('base64')
}

module.exports = {
  decodeBase64,
  encodeBase64,
}
