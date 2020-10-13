const { Sequelize, DataTypes, Model } = require('sequelize')

const init = require('./init.js')
sequelize = init.connect()



class Contact extends Model {}

Contact.init({
  contact_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    //allowNull: false,
  },
  label: {
    type: DataTypes.TEXT,
  },
  meta_data: {
    type: DataTypes.JSON,
  },
  created_at: {
    type: DataTypes.DATE,
  },
  updated_at: {
    type: DataTypes.DATE,
  },
}, {
  sequelize, // Pass the connection instance
  modelName: 'Contact',
  tableName: 'contacts', // Our table names don't follow the sequelize convention and thus must be explicitly declared
  timestamps: false,
})



class Connection extends Model {}

Connection.init({
  connection_id: {
    type: DataTypes.TEXT,
    unique: true,
    primaryKey: true,
    allowNull: false,
  },
  state: {
    type: DataTypes.TEXT,
  },
  my_did: {
    type: DataTypes.TEXT,
  },
  alias: {
    type: DataTypes.TEXT,
  },
  request_id: {
    type: DataTypes.TEXT,
  },
  invitation_key: {
    type: DataTypes.TEXT,
  },
  invitation_mode: {
    type: DataTypes.TEXT,
  },
  invitation_url: {
    type: DataTypes.TEXT,
  },
  invitation: {
    type: DataTypes.JSON,
  },
  accept: {
    type: DataTypes.TEXT,
  },
  initiator: {
    type: DataTypes.TEXT,
  },
  their_role: {
    type: DataTypes.TEXT,
  },
  their_did: {
    type: DataTypes.TEXT,
  },
  their_label: {
    type: DataTypes.TEXT,
  },
  routing_state: {
    type: DataTypes.TEXT,
  },
  inbound_connection_id: {
    type: DataTypes.TEXT,
  },
  error_msg: {
    type: DataTypes.TEXT,
  },
  created_at: {
    type: DataTypes.DATE,
  },
  updated_at: {
    type: DataTypes.DATE,
  },
}, {
  sequelize, // Pass the connection instance
  modelName: 'Connection',
  tableName: 'connections', // Our table names don't follow the sequelize convention and thus must be explicitly declared
  timestamps: false,
})

const Contact_Connection = sequelize.define(
  'connections_to_contacts',
  {
    contact_id: DataTypes.INTEGER,
    connection_id: DataTypes.TEXT,
  }, {
    timestamps: false
  }
)
Contact.belongsToMany(Connection, { through: Contact_Connection, foreignKey: 'contact_id', otherKey: 'connection_id' })
Connection.belongsToMany(Contact, { through: Contact_Connection, foreignKey: 'connection_id', otherKey: 'contact_id' })



exports.createContact = async function(
    // contact_id, // Auto-issued
    label,
    meta_data,
  ) {
  try {
    const timestamp = Date.now()

    const contact = await Contact.create({
      label: label,
      meta_data: meta_data,
      created_at: timestamp,
      updated_at: timestamp,
    })
    // console.log(contact instanceof Contact) // true
    
    console.log('Contact saved successfully.')
    return contact
  } catch (error) {
    console.error('Error saving contact to the database: ', error)
  }
}

exports.readContacts = async function() {
  try {
    const contacts = await Contact.findAll({
      include: [{
        model: Connection,
      }]
    })
    // console.log(contacts.every(contact => contact instanceof Contact)) // true

    console.log("All contacts:", JSON.stringify(contacts, null, 2))
    return contacts
  } catch (error) {
    console.error('Could not find contacts in the database: ', error)
  }
}

exports.readContact = async function(contact_id) {
  try {
    const contact = await Contact.findAll({
      where: {
        contact_id: contact_id
      },
      include: [{
        model: Connection,
      }]
    })
    //console.log(contact[0] instanceof Contact) // true
    
    console.log("Requested contact:", JSON.stringify(contact[0], null, 2))
    return contact[0]
  } catch (error) {
    console.error('Could not find contact in the database: ', error)
  }
}

exports.updateContact = async function(
    contact_id,
    label,
    meta_data,
  ) {
  try {
    const timestamp = Date.now()

    await Contact.update({
      contact_id: contact_id,
      label: label,
      meta_data: meta_data,
      updated_at: timestamp,
    }, {
      where: {
        contact_id: contact_id
      }
    })

    console.log('Contact updated successfully.')
  } catch (error) {
    console.error('Error updating the Contact: ', error) 
  }
}

exports.deleteContact = async function(contact_id) {
  try {
    await Contact.destroy({
      where: {
        contact_id: contact_id
      }
    })

    console.log('Successfully deleted contact')
  } catch (error) {
    console.error('Error while deleting contact: ', error)
  }
}



exports.createConnection = async function(
    connection_id,
    state,
    my_did,
    alias,
    request_id,
    invitation_key,
    invitation_mode,
    invitation_url,
    invitation,
    accept,
    initiator,
    their_role,
    their_did,
    their_label,
    routing_state,
    inbound_connection_id,
    error_msg,
  ) {
  try {
    const timestamp = Date.now()

    const connection = await Connection.create({
      connection_id: connection_id,
      state: state,
      my_did: my_did,
      alias: alias,
      request_id: request_id,
      invitation_key: invitation_key,
      invitation_mode: invitation_mode,
      invitation_url: invitation_url,
      invitation: invitation,
      accept: accept,
      initiator: initiator,
      their_role: their_role,
      their_did: their_did,
      their_label: their_label,
      routing_state: routing_state,
      inbound_connection_id: inbound_connection_id,
      error_msg: error_msg,
      created_at: timestamp,
      updated_at: timestamp, 
    })
    //console.log(connection instanceof Connection) // true

    console.log('Connection saved successfully.')
    return connection
  } catch (error) {
    console.error('Error saving connection to the database: ', error)
  }
}

exports.readConnections = async function() {
  try {
    const connections = await Connection.findAll({
      include: [{
        model: Contact,
      }],
    })
    //console.log(connections.every(connection => connection instanceof Connection)) // true
    
    console.log("All connections:", JSON.stringify(connections, null, 2))
    return connections
  } catch (error) {
    console.error('Could not find connections in the database: ', error)
  }
}

exports.readInvitations = async function(connection_id) {
  try {
    const invitations = await Connection.findAll({
      where: {
        state: 'invitation'
      }
    })
    //console.log(connection[0] instanceof Connection) // true
    
    console.log("All invitations:", JSON.stringify(invitations, null, 2))
    return invitations
  } catch (error) {
    console.error('Could not find connection in the database: ', error)
  }
}

exports.readConnection = async function(connection_id) {
  try {
    const connection = await Connection.findAll({
      where: {
        connection_id: connection_id
      },
      include: [{
        model: Contact,
      }],
    })
    //console.log(connection[0] instanceof Connection) // true
    
    console.log("Requested connection:", JSON.stringify(connection[0], null, 2))
    return connection[0]
  } catch (error) {
    console.error('Could not find connection in the database: ', error)
  }
}

exports.updateConnection = async function(
    connection_id,
    state,
    my_did,
    alias,
    request_id,
    invitation_key,
    invitation_mode,
    invitation_url,
    invitation,
    accept,
    initiator,
    their_role,
    their_did,
    their_label,
    routing_state,
    inbound_connection_id,
    error_msg,
  ) {
  try {
    const timestamp = Date.now()

    await Connection.update({
      connection_id: connection_id,
      state: state,
      my_did: my_did,
      alias: alias,
      request_id: request_id,
      invitation_key: invitation_key,
      invitation_mode: invitation_mode,
      invitation_url: invitation_url,
      invitation: invitation,
      accept: accept,
      initiator: initiator,
      their_role: their_role,
      their_did: their_did,
      their_label: their_label,
      routing_state: routing_state,
      inbound_connection_id: inbound_connection_id,
      error_msg: error_msg,
      updated_at: timestamp,
    }, {
      where: {
        connection_id: connection_id
      }
    })

    console.log('Connection updated successfully.')
  } catch (error) {
    console.error('Error updating the Connection: ', error) 
  }
}

exports.deleteConnection = async function(connection_id) {
  try {
    await Connection.destroy({
      where: {
        connection_id: connection_id
      }
    })

    console.log('Successfully deleted connection')
  } catch (error) {
    console.error('Error while deleting connection: ', error)
  }
}




exports.linkContactAndConnection = async function(contact_id, connection_id) {
  try {
    const contact = await exports.readContact(contact_id)
    const connection = await exports.readConnection(connection_id)

    await contact.addConnection(connection, {})

    console.log('Successfully linked contact and connection')
  } catch (error) {
    console.error('Error linking contact and connection', error)
  }
}