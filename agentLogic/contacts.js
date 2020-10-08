const AdminAPI = require('../adminAPI')

//Perform Agent Business Logic

//Fetch an existing connection
const fetchConnection = async (connectionID) => {
  try {
    //(JamesKEbert)TODO:Change to use Controller DB versus Admin API Call
    const connection = await AdminAPI.Connections.fetchConnection(connectionID)
    console.log(connection)

    return connection
  } catch (error) {
    console.error('Error Fetching Connection')
    throw error
  }
}

module.exports = {
  fetchConnection,
}
