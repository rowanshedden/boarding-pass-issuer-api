const {Sequelize, DataTypes, Model} = require('sequelize')

const init = require('./init.js')
sequelize = init.connect()

class Contact extends Model {}
exports.Contact = Contact

Contact.init(
  {
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
  },
  {
    sequelize, // Pass the connection instance
    modelName: 'Contact',
    tableName: 'contacts', // Our table names don't follow the sequelize convention and thus must be explicitly declared
    timestamps: false,
  },
)

const {Connection} = require('./connections.js')

const createContact = async function (
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

const readBaseContact = async function (contact_id) {
  try {
    const contact = await Contact.findAll({
      where: {
        contact_id: contact_id,
      },
    })

    console.log('Requested contact:', JSON.stringify(contact[0], null, 2))
    return contact[0]
  } catch (error) {
    console.error('Could not find contact in the database: ', error)
  }
}

const readBaseContacts = async function () {
  try {
    const contacts = await Contact.findAll()

    // console.log('All contacts:', JSON.stringify(contacts, null, 2))
    return contacts
  } catch (error) {
    console.error('Could not find contacts in the database: ', error)
  }
}

const updateContact = async function (contact_id, label, meta_data) {
  try {
    const timestamp = Date.now()

    await Contact.update(
      {
        contact_id: contact_id,
        label: label,
        meta_data: meta_data,
        updated_at: timestamp,
      },
      {
        where: {
          contact_id: contact_id,
        },
      },
    )

    console.log('Contact updated successfully.')
  } catch (error) {
    console.error('Error updating the Contact: ', error)
  }
}

const deleteContact = async function (contact_id) {
  try {
    await Contact.destroy({
      where: {
        contact_id: contact_id,
      },
    })

    console.log('Successfully deleted contact')
  } catch (error) {
    console.error('Error while deleting contact: ', error)
  }
}

module.exports = {
  Contact,
  createContact,
  readBaseContact,
  readBaseContacts,
  updateContact,
  deleteContact,
}
