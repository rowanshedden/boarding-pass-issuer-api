const sendAdminMessage = require('./transport');

const fetchSchema = async (schema_id) => {
	try{
		console.log("Fetching Schema");

		const schema = await sendAdminMessage('get', `/schemas/${schema_id}`, {}, {});


		return schema.schema;
		
	} catch (error) {
		console.error("Fetching Schema Error")
		throw error;
	}
}

module.exports = {
	fetchSchema
}