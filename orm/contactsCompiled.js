const {Contact} = require('./contacts.js')
const {Connection} = require('./connections.js')
const {findOffset} = require('./pagination.js')
const {Traveler} = require('./travelers.js')
const {Passport} = require('./passports.js')

const readContacts = async function (params = {}, additionalTables = []) {
  try {
    let models = []

    const sort = params.sort ? params.sort : [['updated_at', 'ASC']]
    const pageSize = params.pageSize ? params.pageSize : 2
    const currentPage = params.currentPage ? params.currentPage : 1
    const pageCount = params.pageCount ? params.pageCount : 1
    const itemCount = params.itemCount ? params.itemCount : undefined

    if (additionalTables.includes('Traveler')) {
      models.push({
        model: Traveler,
        required: false,
        separate: false,
      })
    }
    if (additionalTables.includes('Passport')) {
      models.push({
        model: Passport,
        required: false,
        separate: false,
      })
    }

    const rawContacts = await Contact.findAndCountAll({
      include: [
        {
          model: Connection,
          required: true,
          separate: false,
        },
        ...models,
      ],
      order: sort,
      offset: await findOffset(pageSize, currentPage, itemCount),
      limit: pageSize,
    })

    let newPageCount = Math.ceil(rawContacts.count / pageSize)
    if (newPageCount === 0) newPageCount = 1

    // (mikekebert) We send back the data, the new item count (in case it has changed), and the new calculated page count (in case it has changed)
    // We also send back the original parameters that were used to retrieve this data so that the client can understand how the data was derived
    const contacts = {
      params: {
        sort: sort,
        pageSize: pageSize,
        currentPage: currentPage,
        pageCount: newPageCount,
        itemCount: rawContacts.count,
      },
      rows: rawContacts.rows,
      count: rawContacts.count,
    }

    return contacts
  } catch (error) {
    console.error('Could not find contacts in the database: ', error)
  }
}

const readContact = async function (contact_id, additionalTables = []) {
  try {
    let models = []

    if (additionalTables.includes('Traveler')) {
      models.push({
        model: Traveler,
        required: false,
      })
    }
    if (additionalTables.includes('Passport')) {
      models.push({
        model: Passport,
        required: false,
      })
    }

    const contact = await Contact.findAll({
      where: {
        contact_id,
      },
      include: [
        {
          model: Connection,
          required: true,
        },
        ...models,
      ],
    })

    return contact[0]
  } catch (error) {
    console.error('Could not find contact in the database: ', error)
  }
}

const readContactByConnection = async function (
  connection_id,
  additionalTables = [],
) {
  try {
    let models = []

    if (additionalTables.length > 0) {
      if (additionalTables.includes('Traveler')) {
        models.push({
          model: Traveler,
          required: false,
        })
      }
      if (additionalTables.includes('Passport')) {
        models.push({
          model: Passport,
          required: false,
        })
      }
    }

    const contact = await Contact.findAll({
      include: [
        {
          model: Connection,
          required: true,
          where: {
            connection_id: connection_id,
          },
        },
        ...models,
      ],
    })

    return contact[0]
  } catch (error) {
    console.error('Could not find contact in the database: ', error)
  }
}

module.exports = {
  readContact,
  readContacts,
  readContactByConnection,
}
