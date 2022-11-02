const {DateTime} = require('luxon')
const {v4: uuid} = require('uuid')
const crypto = require('crypto')

const ControllerError = require('../errors')

const AdminAPI = require('../adminAPI')
const Websockets = require('../websockets')
const ConnectionsState = require('../agentLogic/connectionsState')
const Credentials = require('./credentials')
const Governance = require('./governance')
const Travelers = require('./travelers')
const Presentations = require('../orm/presentations')

const {getOrganization} = require('./settings')

const Util = require('../util')

// (eldersonar) Request identity proof
const requestIdentityPresentation = async (connectionID) => {
  console.log(`Requesting Presentation from Connection: ${connectionID}`)

  const result = AdminAPI.Presentations.requestProof(
    connectionID,
    // (eldersonar) Add remaining fields when the holder is fixed.
    [
      'email',
      'phone',
      'address',
      'surname',
      'given_names',
      'sex',
      'date_of_birth',
    ],
  )
  return result
}

const requestSchemaPresentation = async (
  connection_id,
  schema_attributes,
  schema_id,
) => {
  console.log(`Requesting Presentation from Connection: ${connection_id}`)

  return await AdminAPI.Presentations.requestPresentationBySchemaId(
    connection_id,
    schema_attributes,
    schema_id,
    'Requesting Presentation',
    false,
  )
}

// (Eldersonar) This function takes an array of arrays and returns the cartesian product
// (Eldersonar) Spread (...args) if want to send multiple arrays instead of array of arrays
function cartesian(args) {
  let result = [],
    max = args.length - 1

  // Recursive helper function
  function helper(arr, i) {
    for (let j = 0, l = args[i].length; j < l; j++) {
      let a = arr.slice(0) // clone arr
      a.push(args[i][j])
      if (i == max) {
        result.push(a)
      } else helper(a, i + 1)
    }
  }
  helper([], 0)
  return result
}

// TODO: remove after development
// let counter = 0

const createPresentationRequest = async (
  connectionID,
  predicates,
  attributes,
  name,
  comment,
) => {
  // console.log("________________________________________________")
  // console.log("This is the counter")
  // console.log(counter)
  // console.log("")
  // console.log(name)
  // console.log(predicates)
  // console.log(attributes)
  // console.log("____________________________________")

  // (eldersonar) Send presentation request
  await AdminAPI.Presentations.requestPresentation(
    connectionID,
    predicates,
    attributes,
    name,
    comment,
    false,
  )
}

// (eldersonar) Complex input descriptors handler (one or multiple in-field conditions)
const handleCartesianProductSet = async (
  descriptor,
  cartesianSet,
  connectionID,
) => {
  try {
    const date = Math.floor(Date.now() / 1000)
    const schema_id = descriptor.schema[0].uri
    const name = descriptor.name
    const comment = `Requesting Presentation for ${descriptor.name}`

    // (eldersonar) For each cartesian product of sets
    for (let i = 0; i < cartesianSet.length; i++) {
      let attributes = {}
      let predicates = {}

      // Cartesian product descriptor handler loop
      for (let j = 0; j < cartesianSet[i].length; j++) {
        const dependentPath = cartesianSet[i][j].dependent_fields[0].path
          .join('')
          .split('$.')[1] // (eldersonar) will be not valid if have more than 1 path in the array

        // (eldersonar) Push descriptors into array from cartesion set (in-field dependent fields)
        if (cartesianSet[i][j].dependent_fields[0].filter.exclusiveMinimum) {
          if (
            cartesianSet[i][
              j
            ].dependent_fields[0].filter.exclusiveMinimum.includes('today:')
          ) {
            predicates[dependentPath] = {
              p_type: '>',
              p_value:
                date -
                cartesianSet[i][
                  j
                ].dependent_fields[0].filter.exclusiveMinimum.split(':')[2],
              name: dependentPath,
              restrictions: [
                {
                  schema_id,
                },
              ],
            }
          } else {
            predicates[dependentPath] = {
              p_type: '>',
              p_value: date,
              name: dependentPath,
              restrictions: [
                {
                  schema_id,
                },
              ],
            }
          }
        } else if (cartesianSet[i][j].dependent_fields[0].filter.minimum) {
          if (
            cartesianSet[i][j].dependent_fields[0].filter.minimum.includes(
              'today:',
            )
          ) {
            predicates[dependentPath] = {
              p_type: '>=',
              p_value:
                date -
                cartesianSet[i][j].dependent_fields[0].filter.minimum.split(
                  ':',
                )[2],
              name: dependentPath,
              restrictions: [
                {
                  schema_id,
                },
              ],
            }
          } else {
            predicates[dependentPath] = {
              p_type: '>=',
              p_value: date,
              name: dependentPath,
              restrictions: [
                {
                  schema_id,
                },
              ],
            }
          }
        } else if (
          cartesianSet[i][j].dependent_fields[0].filter.exclusiveMaximum
        ) {
          if (
            cartesianSet[i][
              j
            ].dependent_fields[0].filter.exclusiveMaximum.includes('today:')
          ) {
            predicates[dependentPath] = {
              p_type: '<',
              p_value:
                date -
                cartesianSet[i][
                  j
                ].dependent_fields[0].filter.exclusiveMaximum.split(':')[2],
              name: dependentPath,
              restrictions: [
                {
                  schema_id,
                },
              ],
            }
          } else {
            predicates[dependentPath] = {
              p_type: '<',
              p_value: date,
              name: dependentPath,
              restrictions: [
                {
                  schema_id,
                },
              ],
            }
          }
        } else if (cartesianSet[i][j].dependent_fields[0].filter.maximum) {
          if (
            cartesianSet[i][j].dependent_fields[0].filter.maximum.includes(
              'today:',
            )
          ) {
            predicates[dependentPath] = {
              p_type: '<=',
              p_value:
                date -
                cartesianSet[i][j].dependent_fields[0].filter.maximum.split(
                  ':',
                )[2],
              name: dependentPath,
              restrictions: [
                {
                  schema_id,
                },
              ],
            }
          } else {
            predicates[dependentPath] = {
              p_type: '<=',
              p_value: date,
              name: dependentPath,
              restrictions: [
                {
                  schema_id,
                },
              ],
            }
          }
        }
      }

      // (eldersonar) Regular descriptors handler loop
      for (let k = 0; k < descriptor.constraints.fields.length; k++) {
        const path = descriptor.constraints.fields[k].path
          .join('')
          .split('$.')[1] // (eldersonar) will be not valid if have more than 1 path in the array

        // (eldersonar) Push regular descriptors into array
        if (descriptor.constraints.fields[k].filter.exclusiveMinimum) {
          if (
            descriptor.constraints.fields[k].filter.exclusiveMinimum.includes(
              'today:',
            )
          ) {
            predicates[path] = {
              p_type: '>',
              p_value:
                date -
                descriptor.constraints.fields[k].filter.exclusiveMinimum.split(
                  ':',
                )[2],
              name: path,
              restrictions: [
                {
                  schema_id,
                },
              ],
            }
          } else {
            predicates[path] = {
              p_type: '>',
              p_value: date,
              name: path,
              restrictions: [
                {
                  schema_id,
                },
              ],
            }
          }
        } else if (descriptor.constraints.fields[k].filter.minimum) {
          if (
            descriptor.constraints.fields[k].filter.minimum.includes('today:')
          ) {
            predicates[path] = {
              p_type: '>=',
              p_value:
                date -
                descriptor.constraints.fields[k].filter.minimum.split(':')[2],
              name: path,
              restrictions: [
                {
                  schema_id,
                },
              ],
            }
          } else {
            predicates[path] = {
              p_type: '>=',
              p_value: date,
              name: path,
              restrictions: [
                {
                  schema_id,
                },
              ],
            }
          }
        } else if (descriptor.constraints.fields[k].filter.exclusiveMaximum) {
          if (
            descriptor.constraints.fields[k].filter.exclusiveMaximum.includes(
              'today:',
            )
          ) {
            predicates[path] = {
              p_type: '<',
              p_value:
                date -
                descriptor.constraints.fields[k].filter.exclusiveMaximum.split(
                  ':',
                )[2],
              name: path,
              restrictions: [
                {
                  schema_id,
                },
              ],
            }
          } else {
            predicates[path] = {
              p_type: '<',
              p_value: date,
              name: path,
              restrictions: [
                {
                  schema_id,
                },
              ],
            }
          }
        } else if (descriptor.constraints.fields[k].filter.maximum) {
          if (
            descriptor.constraints.fields[k].filter.maximum.includes('today:')
          ) {
            predicates[path] = {
              p_type: '<=',
              p_value:
                date -
                descriptor.constraints.fields[k].filter.maximum.split(':')[2],
              name: path,
              restrictions: [
                {
                  schema_id,
                },
              ],
            }
          } else {
            predicates[path] = {
              p_type: '<=',
              p_value: date,
              name: path,
              restrictions: [
                {
                  schema_id,
                },
              ],
            }
          }
          // (eldersonar) Assemble the list of attributes
        } else {
          // attributes.push(path)

          attributes[path] = {
            name: path,
            restrictions: [{schema_id}],
          }
        }
      }

      // (eldersonar) Assemble presentation request
      await createPresentationRequest(
        connectionID,
        predicates,
        attributes,
        name,
        comment,
      )
    }
  } catch (error) {
    console.log(error)
  }
}

// (eldersonar) Simple input descriptors handler (no in-field conditions)
const handleSimpleDescriptors = async (descriptors, connectionID) => {
  try {
    const uid = uuid()
    let attributes = {}
    let predicates = {}
    attributes[uid] = {
      names: [],
    }

    for (let i = 0; i < descriptors.length; i++) {
      const schema_id = descriptors[i].schema[0].uri
      const name = descriptors[i].name
      const comment = `Requesting Presentation for ${descriptors[i].name}`
      const date = Math.floor(Date.now() / 1000)

      for (let j = 0; j < descriptors[i].constraints.fields.length; j++) {
        const path = descriptors[i].constraints.fields[j].path
          .join('')
          .split('$.')[1] // (eldersonar) TODO: turn into a loop. This ill be not valid if have more than 1 path in the array

        // Push descriptors into array
        if (descriptors[i].constraints.fields[j].filter.exclusiveMinimum) {
          if (
            descriptors[i].constraints.fields[
              j
            ].filter.exclusiveMinimum.includes('today:')
          ) {
            predicates[path] = {
              p_type: '>',
              p_value:
                date -
                descriptors[i].constraints.fields[
                  j
                ].filter.exclusiveMinimum.split(':')[2],
              name: path,
              restrictions: [
                {
                  schema_id,
                },
              ],
            }
          } else {
            predicates[path] = {
              p_type: '>',
              p_value: date,
              name: path,
              restrictions: [
                {
                  schema_id,
                },
              ],
            }
          }
        } else if (descriptors[i].constraints.fields[j].filter.minimum) {
          if (
            descriptors[i].constraints.fields[j].filter.minimum.includes(
              'today:',
            )
          ) {
            predicates[path] = {
              p_type: '>=',
              p_value:
                date -
                descriptors[i].constraints.fields[j].filter.minimum.split(
                  ':',
                )[2],
              name: path,
              restrictions: [
                {
                  schema_id,
                },
              ],
            }
          } else {
            predicates[path] = {
              p_type: '>=',
              p_value: date,
              name: path,
              restrictions: [
                {
                  schema_id,
                },
              ],
            }
          }
        } else if (
          descriptors[i].constraints.fields[j].filter.exclusiveMaximum
        ) {
          if (
            descriptors[i].constraints.fields[
              j
            ].filter.exclusiveMaximum.includes('today:')
          ) {
            predicates[path] = {
              p_type: '<',
              p_value:
                date -
                descriptors[i].constraints.fields[
                  j
                ].filter.exclusiveMaximum.split(':')[2],
              name: path,
              restrictions: [
                {
                  schema_id,
                },
              ],
            }
          } else {
            predicates[path] = {
              p_type: '<',
              p_value: date,
              name: path,
              restrictions: [
                {
                  schema_id,
                },
              ],
            }
          }
        } else if (descriptors[i].constraints.fields[j].filter.maximum) {
          if (
            descriptors[i].constraints.fields[j].filter.maximum.includes(
              'today:',
            )
          ) {
            predicates[path] = {
              p_type: '<=',
              p_value:
                date -
                descriptors[i].constraints.fields[j].filter.maximum.split(
                  ':',
                )[2],
              name: path,
              restrictions: [
                {
                  schema_id,
                },
              ],
            }
          } else {
            predicates[path] = {
              p_type: '<=',
              p_value: date,
              name: path,
              restrictions: [
                {
                  schema_id,
                },
              ],
            }
          }
        } else {
          // (eldersonar) Prepare attributes and create restrictions
          attributes[uid].names.push(path)
          attributes[uid].restrictions = [{schema_id: schema_id}]
        }
      }

      // (eldersonar) Assemble presentation request
      await createPresentationRequest(
        connectionID,
        predicates,
        attributes,
        name,
        comment,
      )
    }
  } catch (error) {
    console.log(error)
  }
}

// Governance presentation request
const requestPresentation = async (connectionID, type) => {
  console.log(`Requesting Presentation from Connection: ${connectionID}`)

  await AdminAPI.Connections.sendBasicMessage(connectionID, {
    content:
      'We are requesting some health information you may have in your credential wallet. Please review our request and choose "Share" or "Reject".',
  })

  // (eldersonar) Get governance file and presentation exchange file
  // const pdf = await Governance.getPresentationDefinition()

  //------------ (eldersonar) TODO: remove after trial-------------

  const contact = await Contacts.getContactByConnection(connectionID, [])

  // Update traveler's answer to the question
  await Travelers.updateProofType(contact.contact_id, type)

  let pdf = {}
  if (type === 'Vaccination') {
    pdf = await Governance.getVaccinePresentationDefinition()
  } else if (type === 'Lab') {
    pdf = await Governance.getLabPresentationDefinition()
  }
  //------------ (eldersonar) TODO: remove after trial-------------

  const inputDescriptors = pdf.presentation_definition.input_descriptors

  try {
    const date = Math.floor(Date.now() / 1000)

    // (eldersonar) Check if we have submission requirments
    if (pdf.presentation_definition.submission_requirements) {
      if (
        !pdf.presentation_definition.submission_requirements[0].hasOwnProperty(
          'from_nested',
        )
      ) {
        // Loop through the input descriptors
        let i = inputDescriptors.length

        // (Eldersonar) Loop through all input descriptors
        while (i--) {
          // (eldersonar) Execute if there are any of input descriptors match the submission requirements group value
          if (
            inputDescriptors[i].group.includes(
              pdf.presentation_definition.submission_requirements[0].from,
            )
          ) {
            let predicateArray = []
            let descriptor = {}

            descriptor = inputDescriptors[i]

            console.log('')
            console.log('array of inputDescriptors')
            console.log(inputDescriptors)

            // (Eldersonar) This flag allows to track which input descriptors needs to be removed from the list
            let remove = false

            // Loop through all descriptor fields
            for (
              let j = 0;
              j < inputDescriptors[i].constraints.fields.length;
              j++
            ) {
              // (Eldersonar) If an input descriptor has some in-field conditional logic
              if (inputDescriptors[i].constraints.fields[j].filter.oneOf) {
                // (Eldersonar) Get fields with in-field conditional logic
                predicateArray.push(
                  inputDescriptors[i].constraints.fields[j].filter.oneOf,
                )

                // (Eldersonar) Mark this input descriptor for deletion
                remove = true
              }
            }

            // (Eldersonar) Get cartesian sets here
            if (predicateArray.length) {
              console.log('')
              console.log('this is ready to become cartesian set: ')
              console.log(predicateArray)

              // (Eldersonar) Assign the result of cartesian product of sets to a variable
              let cartesianProduct = cartesian(predicateArray, descriptor)

              await handleCartesianProductSet(
                descriptor,
                cartesianProduct,
                connectionID,
              )
              // (Eldersonar) Clear the predicate array before new iteration
              predicateArray = []
              descriptor = {}

              console.log('')
              console.log('cartesian product of an array set')
              console.log(cartesianProduct)
            }

            cartesianProduct = []

            if (i > -1 && remove) {
              inputDescriptors.splice(i, 1)
            }
          } else {
            console.log(
              'There are no credentials of group ' +
                pdf.presentation_definition.submission_requirements[0].from,
            )
          }
        }

        // (eldersonar) TODO: Wrap into an if statement to check if the the rest of the input descriptors are part of the submission requirment group.
        await handleSimpleDescriptors(inputDescriptors, connectionID)

        // (eldersonar) Handle nested submission requirments
      } else {
        console.log(
          '...........Handling creating proof requests from the nested submission requirements...........',
        )

        for (
          let g = 0;
          g <
          pdf.presentation_definition.submission_requirements[0].from_nested
            .length;
          g++
        ) {
          let chosenDescriptors = []

          for (let f = 0; f < inputDescriptors.length; f++) {
            if (
              inputDescriptors[f].group.includes(
                pdf.presentation_definition.submission_requirements[0]
                  .from_nested[g].from,
              )
            ) {
              chosenDescriptors.push(inputDescriptors[f])
            }
          }

          // Loop through the input descriptors
          let i = chosenDescriptors.length

          // (Eldersonar) Loop through all input descriptors
          while (i--) {
            // (eldersonar) Execute if there are any of input descriptors match the submission requirements group value
            if (
              chosenDescriptors[i].group.includes(
                pdf.presentation_definition.submission_requirements[0]
                  .from_nested[g].from,
              )
            ) {
              let predicateArray = []
              let descriptor = {}

              descriptor = chosenDescriptors[i]

              // (Eldersonar) This flag allows to track which input descriptors needs to be removed from the list
              let remove = false

              // Loop through all descriptor fields
              for (
                let j = 0;
                j < chosenDescriptors[i].constraints.fields.length;
                j++
              ) {
                // (Eldersonar) If an input descriptor has some in-field conditional logic
                if (chosenDescriptors[i].constraints.fields[j].filter.oneOf) {
                  // (Eldersonar) Get fields with in-field conditional logic
                  predicateArray.push(
                    chosenDescriptors[i].constraints.fields[j].filter.oneOf,
                  )

                  // (Eldersonar) Mark this input descriptor for deletion
                  remove = true
                }
              }

              // (Eldersonar) Get cartesian sets here
              if (predicateArray.length) {
                console.log('')
                console.log('this is ready to become cartesian set: ')
                console.log(predicateArray)

                // (Eldersonar) Assign the result of cartesian product of sets to a variable
                let cartesianProduct = cartesian(predicateArray, descriptor)

                handleCartesianProductSet(
                  descriptor,
                  cartesianProduct,
                  connectionID,
                )
                // (Eldersonar) Clear the predicate array before new iteration
                predicateArray = []
                descriptor = {}

                console.log('')
                console.log('cartesian product of an array set')
                console.log(cartesianProduct)
              }

              cartesianProduct = []

              if (i > -1 && remove) {
                chosenDescriptors.splice(i, 1)
              }
            } else {
              console.log(
                'There are no credentials of group ' +
                  pdf.presentation_definition.submission_requirements[0].from,
              )
            }
          }

          // (eldersonar) TODO: Wrap into an if statement to check if the the rest of the input descriptors are part of the submission requirment group.
          await handleSimpleDescriptors(chosenDescriptors, connectionID)
        }
      }
    }
  } catch (error) {
    console.error('Error getting proof options')
    throw error
  }
}

const validateFieldByField = (attributes, inputDescriptor) => {
  // (eldersonar) Value validation happens here

  let result = null
  let typePass = false
  let formatPass = false
  let valuePass = false
  let patternPass = false

  for (let key in attributes) {
    if (attributes.hasOwnProperty(key)) {
      console.log('')
      console.log(key + ' -> ' + attributes[key].raw)

      // Create prefixed attribute key
      const prefix = '$.'
      let prefixedKey = ''
      prefixedKey += prefix
      prefixedKey += key

      for (let p = 0; p < inputDescriptor.constraints.fields.length; p++) {
        // (eldersonar) Validate if field can be found
        if (inputDescriptor.constraints.fields[p].path.includes(prefixedKey)) {
          // (eldersonar) Type validation
          if (inputDescriptor.constraints.fields[p].filter.type) {
            switch (inputDescriptor.constraints.fields[p].filter.type) {
              case 'string':
                // Support empty string && attributes[key].raw !== ""
                if (typeof attributes[key].raw === 'string') {
                  // console.log('the type check (STRING) have passed')
                  typePass = true
                } else {
                  console.log('this is NOT A STRING or STRING IS EMPTY')
                  typePass = false
                  break
                }
                break

              case 'number':
                if (!isNaN(attributes[key].raw)) {
                  // console.log('the type check (NUMBER) have passed')
                  typePass = true
                } else {
                  console.log('this is NOT A NUMBER')
                  typePass = false
                  break
                }
                break

              case 'boolean':
                if (
                  attributes[key].raw === 'true' ||
                  attributes[key].raw === 'false'
                ) {
                  // console.log('the type check (BOOLEAN) have passed')
                  typePass = true
                } else {
                  console.log('this is NOT A BOOLEAN')
                  typePass = false
                  break
                }
                break

              default:
                console.log('Error: The type check failed')
                typePass = false
                break
            }
          } else {
            // console.log('no type was found for this attribute')
            typePass = true
          }

          // (eldersonar) Format validation
          if (inputDescriptor.constraints.fields[p].filter.format) {
            let dateNumber = parseInt(attributes[key].raw, 10)

            // (eldersonar) Check if the value can be transformed to a valid number
            if (attributes[key].raw === '') {
              // console.log('format passed')
              formatPass = true
            } else if (!isNaN(dateNumber)) {
              // console.log('the date check (NUMBER) have passed')
              let luxonDate = DateTime.fromMillis(dateNumber).toISO()
              let date = new DateTime(luxonDate).isValid

              // (eldersonar) Check if the valid Luxon datetime format
              if (date) {
                // console.log('the date is: ', date)
                // console.log('format passed')
                formatPass = true
              } else {
                // console.log('this is NOT A DATE')
                console.log('format failed')
                formatPass = false
                break
              }
            } else {
              // console.log('this is NOT A DATE')
              console.log('format failed')
              formatPass = false
              break
            }
          } else {
            // console.log('no format was found for this attribute')
            formatPass = true
          }

          // (eldersonar) Value validation
          if (inputDescriptor.constraints.fields[p].filter.const) {
            // (eldersonar) Check if the value is a number datatype
            if (!isNaN(inputDescriptor.constraints.fields[p].filter.const)) {
              const stringNumber =
                '' + inputDescriptor.constraints.fields[p].filter.const

              if (attributes[key].raw === stringNumber) {
                // console.log('value passed')
                valuePass = true
              } else {
                console.log('value failed')
                valuePass = false
                break
              }
            } else {
              if (
                attributes[key].raw ===
                inputDescriptor.constraints.fields[p].filter.const
              ) {
                // console.log('value passed')
                valuePass = true
              } else {
                console.log('value failed')
                valuePass = false
                break
              }
            }
          } else {
            // console.log('no value was found for this attribute')
            valuePass = true
          }

          // (eldersonar) Pattern validation
          if (inputDescriptor.constraints.fields[p].filter.pattern) {
            // Check if it's base64 encoded
            if (attributes[key].raw === '') {
              // console.log('pattern passed')
              patternPass = true
            } else if (
              Buffer.from(
                inputDescriptor.constraints.fields[p].filter.pattern,
                'base64',
              ).toString('base64') ===
              inputDescriptor.constraints.fields[p].filter.pattern
            ) {
              // console.log('decoding....')

              const decodedPattern = Util.decodeBase64(
                inputDescriptor.constraints.fields[p].filter.pattern,
              )

              const re = new RegExp(decodedPattern)

              // (eldersonar) Test pattern
              if (re.test(attributes[key].raw)) {
                // console.log('pattern passed')
                patternPass = true
              } else {
                console.log('pattern failed')
                patternPass = false
                break
              }
              // If not base64 encoded
            } else {
              const re = new RegExp(
                inputDescriptor.constraints.fields[p].filter.pattern,
              )

              // (eldersonar) Test pattern
              if (re.test(attributes[key].raw)) {
                // console.log('pattern passed')
                patternPass = true
              } else {
                console.log('pattern failed')
                patternPass = false
                break
              }
            }
          } else {
            // console.log('no pattern was found for this attribute')
            patternPass = true
          }
        }
      }
    }
    // Break out of outer loop if validation failed
    if (!typePass || !valuePass || !patternPass || !formatPass) {
      console.log('One of these failed: ')
      console.log('')
      console.log('typePass')
      console.log(typePass)
      console.log('')
      console.log('valuePass')
      console.log(valuePass)
      console.log('')
      console.log('patternPass')
      console.log(patternPass)
      console.log('')
      console.log('formatPass')
      console.log(formatPass)
      console.log('')

      result = false
      break
    } else {
      result = true
    }
  }
  return result
}

// Governance message handler
const adminMessage = async (message) => {
  console.log('Received Presentations Message', message)

  const governance = await Governance.getGovernance()
  const privileges = await Governance.getPrivilegesByRoles()

  if (message.state === 'verified') {
    let endorserDID = null
    let schemaID = null
    const protocol = 'https://didcomm.org/issue-credential/1.0/'

    // Get cred def id and schema id
    if (message.presentation && message.presentation.identifiers.length) {
      endorserDID = message.presentation.identifiers[0].cred_def_id
        .split(':', 1)
        .toString()
      schemaID = message.presentation.identifiers[0].schema_id
    }

    // TODO: Check governance and don't send schema id
    const participantValidated = await Governance.validateParticipant(
      schemaID,
      protocol,
      endorserDID,
    )

    // Update traveler's proof status
    const contact = await Contacts.getContactByConnection(
      message.connection_id,
      ['Traveler'],
    )

    // const pdf = await Governance.getPresentationDefinition()

    //------------ (eldersonar) TODO: remove after trial-------------
    let pdf = {}
    if (contact.Traveler.dataValues.proof_type === 'Vaccination') {
      pdf = await Governance.getVaccinePresentationDefinition()
    } else if (contact.Traveler.dataValues.proof_type === 'Lab') {
      pdf = await Governance.getLabPresentationDefinition()
    } else {
      console.log(
        "The answer doesn't match any existing presentation exchange files",
      )
    }
    //------------ (eldersonar) TODO: remove after trial-------------

    const inputDescriptors = pdf.presentation_definition.input_descriptors

    await Travelers.updateProofStatus(contact.contact_id, message.state)

    if (message.verified === 'true' && participantValidated) {
      let attributes = ''
      let predicates = message.presentation.requested_proof.predicates

      // (mikekebert) Check the data format to see if the presentation requires the referrant pattern
      if (message.presentation.requested_proof.revealed_attr_groups) {
        attributes =
          message.presentation.requested_proof.revealed_attr_groups[
            Object.keys(
              message.presentation.requested_proof.revealed_attr_groups,
            )[0] // Get first group available
          ].values // TODO: this needs to be a for-in loop or similar later
      } else {
        attributes = message.presentation.requested_proof.revealed_attrs
      }

      await AdminAPI.Connections.sendBasicMessage(message.connection_id, {
        content:
          'Thank you for providing your information. We are verifying it now, please wait just a few seconds...',
      })

      const issuerName = await getOrganization()

      let credentialVerifiedAttributes = null

      if (attributes) {
        let credentialAttributes = [
          {
            name: 'traveler_surnames',
            value: attributes.patient_surnames.raw || '',
          },
          {
            name: 'traveler_given_names',
            value: attributes.patient_given_names.raw || '',
          },
          {
            name: 'traveler_date_of_birth',
            value: attributes.patient_date_of_birth.raw || '',
          },
          {
            name: 'traveler_gender_legal',
            value: attributes.patient_gender_legal.raw || '',
          },
          {
            name: 'traveler_country',
            value: attributes.patient_country.raw || '',
          },
          {
            name: 'traveler_origin_country',
            value: '',
          },
          {
            name: 'traveler_email',
            value: attributes.patient_email.raw || '',
          },
          {
            name: 'trusted_traveler_id',
            value: uuid(),
          },
          {
            name: 'trusted_traveler_issue_date_time',
            value: Math.round(
              DateTime.fromISO(new Date()).ts / 1000,
            ).toString(),
          },
          {
            name: 'trusted_traveler_expiration_date_time',
            value: Math.round(
              DateTime.local().plus({days: 30}).ts / 1000,
            ).toString(),
          },
          {
            name: 'governance_applied',
            value: governance.name + ' v' + governance.version,
          },
          {
            name: 'credential_issuer_name',
            value: issuerName.dataValues.value.organizationName || '',
          },
          {
            name: 'credential_issue_date',
            value: Math.round(
              DateTime.fromISO(new Date()).ts / 1000,
            ).toString(),
          },
        ]

        // Validation happens here
        // (eldersonar) Check if we have submission requirments
        if (pdf.presentation_definition.submission_requirements) {
          // (eldersonar) Execute if there are any of input descriptors match the submission requirements group value
          if (
            !pdf.presentation_definition.submission_requirements[0].hasOwnProperty(
              'from_nested',
            )
          ) {
            for (let i = 0; i < inputDescriptors.length; i++) {
              console.log('')
              console.log(
                `Comparing proof with ${inputDescriptors[i].name} input descriptor`,
              )
              console.log('')

              let fields = []
              let proofResult = false

              let fieldsValidationResult = false

              // (eldersonar) Execute if there are any of input descriptors match the submission requirements group value
              if (
                inputDescriptors[i].group.includes(
                  pdf.presentation_definition.submission_requirements[0].from,
                )
              ) {
                // Get an array of attributes
                for (
                  let j = 0;
                  j < inputDescriptors[i].constraints.fields.length;
                  j++
                ) {
                  const fieldPath = inputDescriptors[i].constraints.fields[
                    j
                  ].path
                    .join('')
                    .split('$.')[1] // (eldersonar) TODO: turn into a loop. This will be not valid if have more than 1 path in the array

                  fields.push(fieldPath)
                }
              }

              // (eldersonar) Get and sort the list of proof attributes and descriptor fields
              const proofAttributeKeys = Object.keys(attributes)
              const proofPredicateKeys = Object.keys(predicates)
              const predicatesAndArrays = proofAttributeKeys.concat(
                proofPredicateKeys,
              )
              const sortedProofFields = predicatesAndArrays.sort(function (
                a,
                b,
              ) {
                return a.localeCompare(b)
              })
              const sortedDescriptorFields = fields.sort(function (a, b) {
                return a.localeCompare(b)
              })

              // (eldersonar) Start validation
              if (sortedProofFields.length && sortedDescriptorFields.length) {
                // (eldersonar) Check if there is no array match (no credential match or no predicate match)
                if (
                  JSON.stringify(sortedProofFields) !=
                  JSON.stringify(sortedDescriptorFields)
                ) {
                  // (eldersonar) Get leftover fields with the filter
                  let nonDuplicateFields = sortedProofFields.filter(
                    (val) => !sortedDescriptorFields.includes(val),
                  )

                  for (
                    let k = 0;
                    k < inputDescriptors[i].constraints.fields.length;
                    k++
                  ) {
                    // (eldersonar) Check if input descriptor has in-field conditional logic
                    if (
                      inputDescriptors[i].constraints.fields[k].filter.oneOf
                    ) {
                      for (
                        let l = 0;
                        l <
                        inputDescriptors[i].constraints.fields[k].filter.oneOf
                          .length;
                        l++
                      ) {
                        for (let m = 0; m < nonDuplicateFields.length; m++) {
                          const prefix = '$.'
                          let lookupField = ''
                          lookupField += prefix
                          lookupField += nonDuplicateFields[m]

                          // (eldersonar) If we can find the field name in the list of in-field predicates
                          if (
                            inputDescriptors[i].constraints.fields[
                              k
                            ].filter.oneOf[l].dependent_fields[0].path.includes(
                              lookupField,
                            )
                          ) {
                            // (eldersonar) Removing predicate from the list of sorted fields
                            const index = sortedProofFields.indexOf(
                              nonDuplicateFields[m],
                            )
                            if (index > -1) {
                              sortedProofFields.splice(index, 1)
                            }

                            console.log(sortedProofFields)
                            console.log(sortedDescriptorFields)
                            console.log(
                              JSON.stringify(sortedProofFields) ===
                                JSON.stringify(sortedDescriptorFields),
                            )

                            // (eldersonar) Check if arrays match after the predicates were removed
                            if (
                              JSON.stringify(sortedProofFields) ===
                              JSON.stringify(sortedDescriptorFields)
                            ) {
                              console.log('')
                              console.log(
                                '_____________________________________________',
                              )
                              console.log('Validation of proof was successful.')

                              fieldsValidationResult = validateFieldByField(
                                attributes,
                                inputDescriptors[i],
                              )

                              proofResult = true
                            } else {
                              console.log('Validation failed.')
                              proofResult = false
                            }
                          } else {
                            // console.log("Validation failed. No match was found.")
                            proofResult = false
                          }
                        }
                      }
                    }
                  }
                }
                // (eldersonar) Perfect match, proof fields are validated!
                else {
                  console.log('')
                  console.log('_____________________________________________')
                  console.log('Validation of proof was successful.')

                  fieldsValidationResult = validateFieldByField(
                    attributes,
                    inputDescriptors[i],
                  )

                  proofResult = true
                }
              } else {
                console.log('Error: lacking data for validation')
              }

              console.log('')
              console.log('Validation of proof status is: ', proofResult)
              console.log(
                'Field-by-field validation status is: ',
                fieldsValidationResult,
              )

              // Check if all level validation passed
              if (proofResult && fieldsValidationResult) {
                // --------------------------- Handling and storing success -------------------------

                console.log(' ')
                console.log('-------------Rules validation---------------')
                console.log(' ')

                let vaccineOne = null
                let vaccineTwo = null
                let vaccineThree = null

                console.log('Fetching first vaccine')
                vaccineOne = await ConnectionsState.getConnectionStatesByKey(
                  contact.Connections[0].dataValues.connection_id,
                  'vaccination_1',
                )

                console.log('Fetching second vaccine')
                vaccineTwo = await ConnectionsState.getConnectionStatesByKey(
                  contact.Connections[0].dataValues.connection_id,
                  'vaccination_2',
                )

                console.log('Fetching third vaccine')
                vaccineThree = await ConnectionsState.getConnectionStatesByKey(
                  contact.Connections[0].dataValues.connection_id,
                  'vaccination_3',
                )

                if (contact.Traveler.dataValues.proof_type === 'Vaccination') {
                  console.log('Validating vaccine proof')

                  // (eldersonar) ----------Older than 18 y/o----------
                  if (
                    attributes.patient_date_of_birth.raw * 1000 <
                    DateTime.local().plus({years: -18}).ts
                  ) {
                    console.log('The user is older than 18')

                    // ------------------------MOD------------------------
                    if (attributes.vaccine_manufacturer_code.raw === 'MOD') {
                      console.log('Vaccine manufacturer Moderna')

                      //  ----------Was first vaccine issued at least 187 days ago?----------
                      if (
                        !vaccineOne &&
                        !vaccineTwo &&
                        !vaccineThree &&
                        attributes.vaccine_administration_date.raw * 1000 <
                          DateTime.local().plus({days: -187}).ts
                      ) {
                        console.log(
                          'First vaccine was issued more than 187 days ago. PASS',
                        )

                        // Create new credential row
                        const vaccineData = {
                          rules_pass: true,
                          presentation: {
                            attributes,
                            predicates,
                          },
                        }

                        await ConnectionsState.updateOrCreateConnectionState(
                          contact.Connections[0].dataValues.connection_id,
                          'vaccination_1',
                          vaccineData,
                        )

                        // Ask for second vaccine
                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              'Please, provide your second Moderna vaccination credential',
                          },
                        )

                        setTimeout(() => {
                          // Request presentation
                          requestPresentation(
                            message.connection_id,
                            'Vaccination',
                          )
                        }, 1000)
                      }

                      //  ----------First vaccine issued earlier than 187 days ago----------
                      else if (
                        !vaccineOne &&
                        !vaccineTwo &&
                        !vaccineThree &&
                        attributes.vaccine_administration_date.raw * 1000 >
                          DateTime.local().plus({days: -187}).ts
                      ) {
                        console.log(
                          'First vaccine issued earlier than 187 days ago',
                        )

                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              "The Moderna vaccine you've provided was issued earlier than 187 days ago. Please, provide your first vaccination credential that is older than 187 ago",
                          },
                        )

                        // Ask for second vaccine
                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              'Please, provide your first vaccination credential',
                          },
                        )

                        setTimeout(() => {
                          // Call presentation request to start fresh
                          requestPresentation(
                            message.connection_id,
                            'Vaccination',
                          )
                        }, 1000)
                      }

                      //  ----------Do we have second vaccine?----------
                      else if (
                        vaccineOne &&
                        !vaccineTwo &&
                        !vaccineThree &&
                        attributes.vaccine_administration_date.raw * 1000 <
                          DateTime.local().plus({days: -159}).ts
                      ) {
                        console.log('This is the second vaccine')

                        // Check if attributes from the first vaccine match the presentation attributes
                        const vaccinesMatch = Util.deepEqual(
                          vaccineOne.dataValues.value.presentation.attributes,
                          attributes,
                        )

                        // If 100% match - first vaccine was presented again, send basic message
                        if (vaccinesMatch) {
                          console.log('The first and second vaccines match')
                          // TODO: when swtiched to use governacne actions implement the logic below:
                          // Q&A - would you like to present a different credential?
                          // Q&A yes -> send a loop back and send the presentation request for the failed presentation (with the proper basic message)
                          // Q&A no -> basic message - please, review your vaccine crendetials and try again later

                          // Ask for second vaccine
                          await AdminAPI.Connections.sendBasicMessage(
                            message.connection_id,
                            {
                              content:
                                "The second Moderna vaccine you've presented matches the first one. Please try again and present second vaccination credential.",
                            },
                          )

                          // Ask for second vaccine
                          await AdminAPI.Connections.sendBasicMessage(
                            message.connection_id,
                            {
                              content:
                                'Please, provide your second Moderna vaccination credential',
                            },
                          )

                          setTimeout(() => {
                            // Request presentation
                            requestPresentation(
                              message.connection_id,
                              'Vaccination',
                            )
                          }, 1000)
                        }
                        // If no match - check if the time between vaccine administration dates is at least 28 days
                        else {
                          console.log(
                            "First and second Moderna vaccine credentials didn't match. Checking the 28 days time gap.",
                          )

                          console.log(
                            attributes.vaccine_administration_date.raw -
                              vaccineOne.dataValues.value.presentation
                                .attributes.vaccine_administration_date.raw,
                          )

                          if (
                            attributes.vaccine_administration_date.raw -
                              vaccineOne.dataValues.value.presentation
                                .attributes.vaccine_administration_date.raw <
                            2419200
                          ) {
                            console.log(
                              'The gap between 2 MOD vaccines is less than 28 days. FAIL',
                            )

                            // Ask for second vaccine
                            await AdminAPI.Connections.sendBasicMessage(
                              message.connection_id,
                              {
                                content:
                                  'The time period between the first and second Moderna vaccines must be more than 28 days. Please try again and present second vaccination credential.',
                              },
                            )

                            // Ask for second vaccine
                            await AdminAPI.Connections.sendBasicMessage(
                              message.connection_id,
                              {
                                content:
                                  'Please, provide your second Moderna vaccination credential',
                              },
                            )

                            setTimeout(() => {
                              // Request presentation
                              requestPresentation(
                                message.connection_id,
                                'Vaccination',
                              )
                            }, 1000)
                          } else {
                            console.log(
                              'The gap between 2 MOD vaccines is more than 28 days. PASS',
                            )
                            // Create new credential row
                            const vaccineData = {
                              rules_pass: true,
                              presentation: {
                                attributes,
                                predicates,
                              },
                            }

                            await ConnectionsState.updateOrCreateConnectionState(
                              contact.Connections[0].dataValues.connection_id,
                              'vaccination_2',
                              vaccineData,
                            )

                            // Ask for third vaccine
                            await AdminAPI.Connections.sendBasicMessage(
                              message.connection_id,
                              {
                                content:
                                  'Please, provide your third Moderna vaccination credential',
                              },
                            )

                            setTimeout(() => {
                              // Request presentation
                              requestPresentation(
                                message.connection_id,
                                'Vaccination',
                              )
                            }, 1000)
                          }
                        }
                      }

                      //  ----------Second vaccine issued earlier than 159 days ago----------
                      else if (
                        vaccineOne &&
                        !vaccineTwo &&
                        !vaccineThree &&
                        attributes.vaccine_administration_date.raw * 1000 >
                          DateTime.local().plus({days: -159}).ts
                      ) {
                        console.log(
                          'Second vaccine issued earlier than 159 days ago',
                        )

                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              "The second Moderna vaccine you've provided was issued earlier than 159 days ago. Please, try again",
                          },
                        )

                        // Ask for third vaccine
                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              'Please, provide your second Moderna vaccination credential',
                          },
                        )

                        setTimeout(() => {
                          // Call presentation request to start fresh
                          requestPresentation(
                            message.connection_id,
                            'Vaccination',
                          )
                        }, 1000)
                      }

                      //  ----------Do we have third vaccine?----------
                      else if (
                        vaccineOne &&
                        vaccineTwo &&
                        !vaccineThree &&
                        attributes.vaccine_administration_date.raw * 1000 <
                          DateTime.local().plus({days: -7}).ts
                      ) {
                        console.log('This is the third vaccine')

                        // Check if attributes from the first vaccine match the presentation attributes
                        const vaccinesMatch = Util.deepEqual(
                          vaccineOne.dataValues.value.presentation.attributes,
                          attributes,
                        )

                        const vaccinesMatch2 = Util.deepEqual(
                          vaccineTwo.dataValues.value.presentation.attributes,
                          attributes,
                        )

                        // If 100% match - first vaccine was presented again, send basic message
                        if (vaccinesMatch) {
                          console.log(
                            'The first and third Moderna vaccines match',
                          )

                          // TODO: when swtiched to use governacne actions implement the logic below:
                          // Q&A - would you like to present a different credential?
                          // Q&A yes -> send a loop back and send the presentation request for the failed presentation (with the proper basic message)
                          // Q&A no -> basic message - please, review your vaccine crendetials and try again later

                          // Ask for third vaccine
                          await AdminAPI.Connections.sendBasicMessage(
                            message.connection_id,
                            {
                              content:
                                "The third Moderna vaccine you've presented matches the first one. Please try again and present third vaccination credential.",
                            },
                          )

                          // Ask for second vaccine
                          await AdminAPI.Connections.sendBasicMessage(
                            message.connection_id,
                            {
                              content:
                                'Please, provide your third Moderna vaccination credential',
                            },
                          )

                          setTimeout(() => {
                            // Request presentation
                            requestPresentation(
                              message.connection_id,
                              'Vaccination',
                            )
                          }, 1000)
                        } else if (vaccinesMatch2) {
                          console.log(
                            'The second and third Moderna vaccines match',
                          )

                          // TODO: when swtiched to use governacne actions implement the logic below:
                          // Q&A - would you like to present a different credential?
                          // Q&A yes -> send a loop back and send the presentation request for the failed presentation (with the proper basic message)
                          // Q&A no -> basic message - please, review your vaccine crendetials and try again later

                          // Ask for third vaccine
                          await AdminAPI.Connections.sendBasicMessage(
                            message.connection_id,
                            {
                              content:
                                "The third Moderna vaccine you've presented matches the second one. Please try again and present third vaccination credential.",
                            },
                          )

                          // Ask for second vaccine
                          await AdminAPI.Connections.sendBasicMessage(
                            message.connection_id,
                            {
                              content:
                                'Please, provide your third Moderna vaccination credential',
                            },
                          )

                          setTimeout(() => {
                            // Request presentation
                            requestPresentation(
                              message.connection_id,
                              'Vaccination',
                            )
                          }, 1000)
                        }
                        // If no match - check if the time between vaccine administration dates is at least 152 days
                        else {
                          console.log(
                            "First and second vaccine credentials didn't match. Checking the 152 days time gap.",
                          )

                          console.log(
                            attributes.vaccine_administration_date.raw -
                              vaccineOne.dataValues.value.presentation
                                .attributes.vaccine_administration_date.raw,
                          )

                          if (
                            attributes.vaccine_administration_date.raw -
                              vaccineOne.dataValues.value.presentation
                                .attributes.vaccine_administration_date.raw <
                            13132800
                          ) {
                            console.log(
                              'he gap between the second and third MOD vaccines is less than 152 days. FAIL',
                            )

                            // Ask for third vaccine
                            await AdminAPI.Connections.sendBasicMessage(
                              message.connection_id,
                              {
                                content:
                                  'The time period between the second and the third Moderna vaccines must be more than 152 days. Please try again and present third vaccination credential.',
                              },
                            )

                            // Ask for third vaccine
                            await AdminAPI.Connections.sendBasicMessage(
                              message.connection_id,
                              {
                                content:
                                  'Please, provide your third Moderna vaccination credential',
                              },
                            )

                            setTimeout(() => {
                              // Request presentation
                              requestPresentation(
                                message.connection_id,
                                'Vaccination',
                              )
                            }, 1000)
                          } else {
                            console.log(
                              'The gap between the second and third MOD vaccines is more than 152 days. PASS',
                            )

                            // ----------Create new credential row---------------
                            const vaccineData = {
                              rules_pass: true,
                              presentation: {
                                attributes,
                                predicates,
                              },
                            }

                            await ConnectionsState.updateOrCreateConnectionState(
                              contact.Connections[0].dataValues.connection_id,
                              'vaccination_3',
                              vaccineData,
                            )
                          }
                        }
                      }

                      //  ----------Third vaccine issued earlier than 7 days ago----------
                      else if (
                        vaccineOne &&
                        vaccineTwo &&
                        !vaccineThree &&
                        attributes.vaccine_administration_date.raw * 1000 >
                          DateTime.local().plus({days: -7}).ts
                      ) {
                        console.log('This is the third vaccine')

                        console.log(
                          'Third MOD vaccine issued earlier than 7 days ago',
                        )

                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              "The booster Moderna vaccine you've provided was issued earlier than 7 days ago. Please, provide your third vaccination credential that is older than 7 days ago",
                          },
                        )

                        setTimeout(() => {
                          // Call presentation request to start fresh
                          requestPresentation(
                            message.connection_id,
                            'Vaccination',
                          )
                        }, 1000)
                      }
                    }
                    // ------------------------MOD------------------------

                    // ------------------------PFR------------------------
                    else if (
                      attributes.vaccine_manufacturer_code.raw === 'PFR'
                    ) {
                      console.log('Vaccine manufacturer Pfizer')

                      //  ----------Was first vaccine issued at least 180 days ago?----------
                      if (
                        !vaccineOne &&
                        !vaccineTwo &&
                        !vaccineThree &&
                        attributes.vaccine_administration_date.raw * 1000 <
                          DateTime.local().plus({days: -180}).ts
                      ) {
                        console.log(
                          'First vaccine was issued more than 180 days ago. PASS',
                        )

                        // Create new credential row
                        const vaccineData = {
                          rules_pass: true,
                          presentation: {
                            attributes,
                            predicates,
                          },
                        }

                        await ConnectionsState.updateOrCreateConnectionState(
                          contact.Connections[0].dataValues.connection_id,
                          'vaccination_1',
                          vaccineData,
                        )

                        // Ask for second vaccine
                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              'Please, provide your second Pfizer vaccination credential',
                          },
                        )

                        setTimeout(() => {
                          // Request presentation
                          requestPresentation(
                            message.connection_id,
                            'Vaccination',
                          )
                        }, 1000)
                      }

                      //  ----------First vaccine issued earlier than 180 days ago----------
                      else if (
                        !vaccineOne &&
                        !vaccineTwo &&
                        !vaccineThree &&
                        attributes.vaccine_administration_date.raw * 1000 >
                          DateTime.local().plus({days: -180}).ts
                      ) {
                        console.log(
                          'First vaccine issued earlier than 187 days ago',
                        )

                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              "The Pfizer vaccine you've provided was issued earlier than 180 days ago. Please, provide your first vaccination credential that is older than 180 days ago",
                          },
                        )

                        // Ask for second vaccine
                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              'Please, provide your first vaccination credential',
                          },
                        )

                        setTimeout(() => {
                          // Call presentation request to start fresh
                          requestPresentation(
                            message.connection_id,
                            'Vaccination',
                          )
                        }, 1000)
                      }

                      //  ----------Do we have second vaccine?----------
                      else if (
                        vaccineOne &&
                        !vaccineTwo &&
                        !vaccineThree &&
                        attributes.vaccine_administration_date.raw * 1000 <
                          DateTime.local().plus({days: -159}).ts
                      ) {
                        console.log('This is the second Pfizer vaccine')

                        // Check if attributes from the first vaccine match the presentation attributes
                        const vaccinesMatch = Util.deepEqual(
                          vaccineOne.dataValues.value.presentation.attributes,
                          attributes,
                        )

                        // If 100% match - first vaccine was presented again, send basic message
                        if (vaccinesMatch) {
                          console.log(
                            'The first and second Pfizer vaccines match',
                          )
                          // TODO: when swtiched to use governacne actions implement the logic below:
                          // Q&A - would you like to present a different credential?
                          // Q&A yes -> send a loop back and send the presentation request for the failed presentation (with the proper basic message)
                          // Q&A no -> basic message - please, review your vaccine crendetials and try again later

                          // Ask for second vaccine
                          await AdminAPI.Connections.sendBasicMessage(
                            message.connection_id,
                            {
                              content:
                                "The second Pfizer vaccine you've presented matches the first one. Please try again and present second vaccination credential.",
                            },
                          )

                          // Ask for second vaccine
                          await AdminAPI.Connections.sendBasicMessage(
                            message.connection_id,
                            {
                              content:
                                'Please, provide your second Pfizer vaccination credential',
                            },
                          )

                          setTimeout(() => {
                            // Request presentation
                            requestPresentation(
                              message.connection_id,
                              'Vaccination',
                            )
                          }, 1000)
                        }
                        // If no match - check if the time between vaccine administration dates is at least 21 days
                        else {
                          console.log(
                            "First Pfizer and second Pfizer vaccine credentials didn't match. Checking the 21 days time gap.",
                          )

                          console.log(
                            attributes.vaccine_administration_date.raw -
                              vaccineOne.dataValues.value.presentation
                                .attributes.vaccine_administration_date.raw,
                          )

                          if (
                            attributes.vaccine_administration_date.raw -
                              vaccineOne.dataValues.value.presentation
                                .attributes.vaccine_administration_date.raw <
                            1814400
                          ) {
                            console.log(
                              'The gap between 2 PFR vaccines is less than 21 days. FAIL',
                            )

                            // Ask for second vaccine
                            await AdminAPI.Connections.sendBasicMessage(
                              message.connection_id,
                              {
                                content:
                                  'The time period between the first and the second Pfizer vaccines must be more than 21 days. Please try again and present second vaccination credential.',
                              },
                            )

                            // Ask for second vaccine
                            await AdminAPI.Connections.sendBasicMessage(
                              message.connection_id,
                              {
                                content:
                                  'Please, provide your second Pfizer vaccination credential',
                              },
                            )

                            setTimeout(() => {
                              // Request presentation
                              requestPresentation(
                                message.connection_id,
                                'Vaccination',
                              )
                            }, 1000)
                          } else {
                            console.log(
                              'The gap between 2 PFR vaccines is more than 21 days. PASS',
                            )
                            // Create new credential row
                            const vaccineData = {
                              rules_pass: true,
                              presentation: {
                                attributes,
                                predicates,
                              },
                            }

                            await ConnectionsState.updateOrCreateConnectionState(
                              contact.Connections[0].dataValues.connection_id,
                              'vaccination_2',
                              vaccineData,
                            )

                            // Ask for third vaccine
                            await AdminAPI.Connections.sendBasicMessage(
                              message.connection_id,
                              {
                                content:
                                  'Please, provide your third Pfizer vaccination credential',
                              },
                            )

                            setTimeout(() => {
                              // Request presentation
                              requestPresentation(
                                message.connection_id,
                                'Vaccination',
                              )
                            }, 1000)
                          }
                        }
                      }

                      //  ----------Second vaccine issued earlier than 159 days ago----------
                      else if (
                        vaccineOne &&
                        !vaccineTwo &&
                        !vaccineThree &&
                        attributes.vaccine_administration_date.raw * 1000 >
                          DateTime.local().plus({days: -159}).ts
                      ) {
                        console.log(
                          'Second Pfizer vaccine issued earlier than 159 days ago',
                        )

                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              "The second Pfizer vaccine you've provided was issued earlier than 159 days ago. Please, try again",
                          },
                        )

                        // Ask for third vaccine
                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              'Please, provide your second Pfizer vaccination credential',
                          },
                        )

                        setTimeout(() => {
                          // Call presentation request to start fresh
                          requestPresentation(
                            message.connection_id,
                            'Vaccination',
                          )
                        }, 1000)
                      }

                      //  ----------Do we have third vaccine?----------
                      else if (
                        vaccineOne &&
                        vaccineTwo &&
                        !vaccineThree &&
                        attributes.vaccine_administration_date.raw * 1000 <
                          DateTime.local().plus({days: -7}).ts
                      ) {
                        console.log('This is the third Pfizer vaccine')

                        // Check if attributes from the first vaccine match the presentation attributes
                        const vaccinesMatch = Util.deepEqual(
                          vaccineOne.dataValues.value.presentation.attributes,
                          attributes,
                        )

                        const vaccinesMatch2 = Util.deepEqual(
                          vaccineTwo.dataValues.value.presentation.attributes,
                          attributes,
                        )

                        // If 100% match - first vaccine was presented again, send basic message
                        if (vaccinesMatch) {
                          console.log(
                            'The first and third Pfizer vaccines match',
                          )

                          // TODO: when swtiched to use governacne actions implement the logic below:
                          // Q&A - would you like to present a different credential?
                          // Q&A yes -> send a loop back and send the presentation request for the failed presentation (with the proper basic message)
                          // Q&A no -> basic message - please, review your vaccine crendetials and try again later

                          // Ask for third vaccine
                          await AdminAPI.Connections.sendBasicMessage(
                            message.connection_id,
                            {
                              content:
                                "The third Pfizer vaccine you've presented matches the first one. Please try again and present third vaccination credential.",
                            },
                          )

                          // Ask for second vaccine
                          await AdminAPI.Connections.sendBasicMessage(
                            message.connection_id,
                            {
                              content:
                                'Please, provide your third Pfizer vaccination credential',
                            },
                          )

                          setTimeout(() => {
                            // Request presentation
                            requestPresentation(
                              message.connection_id,
                              'Vaccination',
                            )
                          }, 1000)
                        } else if (vaccinesMatch2) {
                          console.log('Or the second and third vaccines match')

                          // TODO: when swtiched to use governacne actions implement the logic below:
                          // Q&A - would you like to present a different credential?
                          // Q&A yes -> send a loop back and send the presentation request for the failed presentation (with the proper basic message)
                          // Q&A no -> basic message - please, review your vaccine crendetials and try again later

                          // Ask for third vaccine
                          await AdminAPI.Connections.sendBasicMessage(
                            message.connection_id,
                            {
                              content:
                                "The third Pfizer vaccine you've presented matches the second one. Please try again and present third vaccination credential.",
                            },
                          )

                          // Ask for second vaccine
                          await AdminAPI.Connections.sendBasicMessage(
                            message.connection_id,
                            {
                              content:
                                'Please, provide your third Pfizer vaccination credential',
                            },
                          )

                          setTimeout(() => {
                            // Request presentation
                            requestPresentation(
                              message.connection_id,
                              'Vaccination',
                            )
                          }, 1000)
                        }
                        // If no match - check if the time between vaccine administration dates is at least 152 days
                        else {
                          console.log(
                            "First and second Pfizer vaccine credentials didn't match. Checking the 152 days time gap.",
                          )

                          console.log(
                            attributes.vaccine_administration_date.raw -
                              vaccineOne.dataValues.value.presentation
                                .attributes.vaccine_administration_date.raw,
                          )

                          if (
                            attributes.vaccine_administration_date.raw -
                              vaccineOne.dataValues.value.presentation
                                .attributes.vaccine_administration_date.raw <
                            13132800
                          ) {
                            console.log(
                              'The gap between the second and third PFR vaccines is less than 152 days. FAIL',
                            )

                            // Ask for third vaccine
                            await AdminAPI.Connections.sendBasicMessage(
                              message.connection_id,
                              {
                                content:
                                  'The time period between the second and the third Pfizer vaccines must be more than 152 days. Please try again and present third vaccination credential.',
                              },
                            )

                            // Ask for third vaccine
                            await AdminAPI.Connections.sendBasicMessage(
                              message.connection_id,
                              {
                                content:
                                  'Please, provide your third Pfizer vaccination credential',
                              },
                            )

                            setTimeout(() => {
                              // Request presentation
                              requestPresentation(
                                message.connection_id,
                                'Vaccination',
                              )
                            }, 1000)
                          } else {
                            console.log(
                              'The gap between the second and third PFR vaccines is more than 152 days. PASS',
                            )

                            // ----------Create new credential row---------------
                            const vaccineData = {
                              rules_pass: true,
                              presentation: {
                                attributes,
                                predicates,
                              },
                            }

                            await ConnectionsState.updateOrCreateConnectionState(
                              contact.Connections[0].dataValues.connection_id,
                              'vaccination_3',
                              vaccineData,
                            )
                          }
                        }
                      }

                      //  ----------Third vaccine issued earlier than 7 days ago----------
                      else if (
                        vaccineOne &&
                        vaccineTwo &&
                        !vaccineThree &&
                        attributes.vaccine_administration_date.raw * 1000 >
                          DateTime.local().plus({days: -7}).ts
                      ) {
                        console.log('This is the third Pfizer vaccine')

                        console.log(
                          'Third Pfizer vaccine issued earlier than 7 days ago',
                        )

                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              "The third Pfizer vaccine you've provided was issued earlier than 7 days ago.",
                          },
                        )

                        // Ask for third vaccine
                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              'Please, provide your third Pfizer vaccination credential',
                          },
                        )

                        setTimeout(() => {
                          // Call presentation request to start fresh
                          requestPresentation(
                            message.connection_id,
                            'Vaccination',
                          )
                        }, 1000)
                      }
                    }
                    // ------------------------PFR------------------------

                    // ------------------------JSN------------------------
                    else if (
                      attributes.vaccine_manufacturer_code.raw === 'JSN'
                    ) {
                      console.log('Vaccine manufacturer Johnson')

                      //  ----------Was first vaccine issued at least 68 days ago?----------
                      if (
                        !vaccineOne &&
                        !vaccineTwo &&
                        !vaccineThree &&
                        attributes.vaccine_administration_date.raw * 1000 <
                          DateTime.local().plus({days: -68}).ts
                      ) {
                        console.log(
                          'First vaccine was issued more than 68 days ago. PASS',
                        )

                        // Create new credential row
                        const vaccineData = {
                          rules_pass: true,
                          presentation: {
                            attributes,
                            predicates,
                          },
                        }

                        await ConnectionsState.updateOrCreateConnectionState(
                          contact.Connections[0].dataValues.connection_id,
                          'vaccination_1',
                          vaccineData,
                        )

                        // Ask for second vaccine
                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              'Please, provide your second Johnson and Johnson vaccination credential',
                          },
                        )

                        setTimeout(() => {
                          // Request presentation
                          requestPresentation(
                            message.connection_id,
                            'Vaccination',
                          )
                        }, 1000)
                      }

                      //  ----------First vaccine issued earlier than 68 days ago----------
                      else if (
                        !vaccineOne &&
                        !vaccineTwo &&
                        !vaccineThree &&
                        attributes.vaccine_administration_date.raw * 1000 >
                          DateTime.local().plus({days: -68}).ts
                      ) {
                        console.log(
                          'First JSN vaccine issued earlier than 68 days ago',
                        )

                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              "The Johnson and Johnson vaccine you've provided was issued earlier than 68 days ago. Please, provide your first vaccination credential that is older than 68 days ago",
                          },
                        )

                        // Ask for second vaccine
                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              'Please, provide your first vaccination credential',
                          },
                        )

                        setTimeout(() => {
                          // Call presentation request to start fresh
                          requestPresentation(
                            message.connection_id,
                            'Vaccination',
                          )
                        }, 1000)
                      }

                      //  ----------Do we have second vaccine?----------
                      else if (
                        vaccineOne &&
                        !vaccineTwo &&
                        !vaccineThree &&
                        attributes.vaccine_administration_date.raw * 1000 <
                          DateTime.local().plus({days: -7}).ts
                      ) {
                        console.log(
                          'This is the second Johnson and Johnson vaccine',
                        )

                        // Check if attributes from the first vaccine match the presentation attributes
                        const vaccinesMatch = Util.deepEqual(
                          vaccineOne.dataValues.value.presentation.attributes,
                          attributes,
                        )

                        // If 100% match - first vaccine was presented again, send basic message
                        if (vaccinesMatch) {
                          console.log(
                            'The first and second Johnson and Johnson vaccines match',
                          )
                          // TODO: when swtiched to use governacne actions implement the logic below:
                          // Q&A - would you like to present a different credential?
                          // Q&A yes -> send a loop back and send the presentation request for the failed presentation (with the proper basic message)
                          // Q&A no -> basic message - please, review your vaccine crendetials and try again later

                          // Ask for second vaccine
                          await AdminAPI.Connections.sendBasicMessage(
                            message.connection_id,
                            {
                              content:
                                "The second Johnson and Johnson vaccine you've presented matches the first one. Please try again and present second vaccination credential.",
                            },
                          )

                          // Ask for second vaccine
                          await AdminAPI.Connections.sendBasicMessage(
                            message.connection_id,
                            {
                              content:
                                'Please, provide your second Johnson and Johnson vaccination credential',
                            },
                          )

                          setTimeout(() => {
                            // Request presentation
                            requestPresentation(
                              message.connection_id,
                              'Vaccination',
                            )
                          }, 1000)
                        }
                        // If no match - check if the time between vaccine administration dates is at least 61 days
                        else {
                          console.log(
                            "First Johnson and Johnson and second Pfizer vaccine credentials didn't match. Checking the 61 days time gap.",
                          )

                          console.log(
                            attributes.vaccine_administration_date.raw -
                              vaccineOne.dataValues.value.presentation
                                .attributes.vaccine_administration_date.raw,
                          )

                          if (
                            attributes.vaccine_administration_date.raw -
                              vaccineOne.dataValues.value.presentation
                                .attributes.vaccine_administration_date.raw <
                            5256006
                          ) {
                            console.log(
                              'The gap between 2 Johnson and Johnson vaccines is less than 61 days. FAIL',
                            )

                            // Ask for second vaccine
                            await AdminAPI.Connections.sendBasicMessage(
                              message.connection_id,
                              {
                                content:
                                  'The time period between the first and the second Johnson and Johnson vaccines must be more than 61 days. Please try again and present second vaccination credential.',
                              },
                            )

                            // Ask for second vaccine
                            await AdminAPI.Connections.sendBasicMessage(
                              message.connection_id,
                              {
                                content:
                                  'Please, provide your second Johnson and Johnson vaccination credential',
                              },
                            )

                            setTimeout(() => {
                              // Request presentation
                              requestPresentation(
                                message.connection_id,
                                'Vaccination',
                              )
                            }, 1000)
                          } else {
                            console.log(
                              'The gap between 2 Johnson and Johnson vaccines is more than 61 days. PASS',
                            )
                            // Create new credential row
                            const vaccineData = {
                              rules_pass: true,
                              presentation: {
                                attributes,
                                predicates,
                              },
                            }

                            await ConnectionsState.updateOrCreateConnectionState(
                              contact.Connections[0].dataValues.connection_id,
                              'vaccination_2',
                              vaccineData,
                            )
                          }
                        }
                      }

                      //  ----------Second vaccine issued earlier than 7 days ago----------
                      else if (
                        vaccineOne &&
                        !vaccineTwo &&
                        !vaccineThree &&
                        attributes.vaccine_administration_date.raw * 1000 >
                          DateTime.local().plus({days: -7}).ts
                      ) {
                        console.log(
                          'Second Johnson and Johnson vaccine issued earlier than 7 days ago',
                        )

                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              "The second Johnson and Johnson vaccine you've provided was issued earlier than 7 days ago. Please, try again",
                          },
                        )

                        // Ask for third vaccine
                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              'Please, provide your second Johnson and Johnson vaccination credential',
                          },
                        )

                        setTimeout(() => {
                          // Call presentation request to start fresh
                          requestPresentation(
                            message.connection_id,
                            'Vaccination',
                          )
                        }, 1000)
                      }
                    }
                  }

                  // (eldersonar) ---------- 12 - 17 y/o----------
                  else if (
                    attributes.patient_date_of_birth.raw * 1000 <
                      DateTime.local().plus({years: -12}).ts &&
                    attributes.patient_date_of_birth.raw * 1000 >
                      DateTime.local().plus({years: -18}).ts
                  ) {
                    console.log('The user is older 12 to 17 years old')

                    // First vaccine
                    // ------------------------MOD------------------------
                    if (attributes.vaccine_manufacturer_code.raw === 'MOD') {
                      console.log('Vaccine manufacturer Moderna')

                      //  ----------Was first vaccine issued at least 42 days ago?----------
                      if (
                        !vaccineOne &&
                        !vaccineTwo &&
                        !vaccineThree &&
                        attributes.vaccine_administration_date.raw * 1000 <
                          DateTime.local().plus({days: -42}).ts
                      ) {
                        console.log(
                          'First vaccine was issued more than 42 days ago. PASS',
                        )

                        // Create new credential row
                        const vaccineData = {
                          rules_pass: true,
                          presentation: {
                            attributes,
                            predicates,
                          },
                        }

                        await ConnectionsState.updateOrCreateConnectionState(
                          contact.Connections[0].dataValues.connection_id,
                          'vaccination_1',
                          vaccineData,
                        )

                        // Ask for second vaccine
                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              'Please, provide your second Moderna vaccination credential',
                          },
                        )

                        setTimeout(() => {
                          // Request presentation
                          requestPresentation(
                            message.connection_id,
                            'Vaccination',
                          )
                        }, 1000)
                      }

                      //  ----------First vaccine issued earlier than 42 days ago----------
                      else if (
                        !vaccineOne &&
                        !vaccineTwo &&
                        !vaccineThree &&
                        attributes.vaccine_administration_date.raw * 1000 >
                          DateTime.local().plus({days: -42}).ts
                      ) {
                        console.log(
                          'First MOD vaccine issued earlier than 42 days ago',
                        )

                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              "The Moderna vaccine you've provided was issued earlier than 42 days ago. Please, provide your first vaccination credential that is older than 42 days ago",
                          },
                        )

                        // Ask for second vaccine
                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              'Please, provide your first vaccination credential',
                          },
                        )

                        setTimeout(() => {
                          // Call presentation request to start fresh
                          requestPresentation(
                            message.connection_id,
                            'Vaccination',
                          )
                        }, 1000)
                      }

                      //  ----------Do we have second vaccine?----------
                      else if (
                        vaccineOne &&
                        !vaccineTwo &&
                        !vaccineThree &&
                        attributes.vaccine_administration_date.raw * 1000 <
                          DateTime.local().plus({days: -14}).ts
                      ) {
                        console.log('This is the second Moderna vaccine')

                        // Check if attributes from the first vaccine match the presentation attributes
                        const vaccinesMatch = Util.deepEqual(
                          vaccineOne.dataValues.value.presentation.attributes,
                          attributes,
                        )

                        // If 100% match - first vaccine was presented again, send basic message
                        if (vaccinesMatch) {
                          console.log(
                            'The first and second Moderna vaccines match',
                          )
                          // TODO: when swtiched to use governacne actions implement the logic below:
                          // Q&A - would you like to present a different credential?
                          // Q&A yes -> send a loop back and send the presentation request for the failed presentation (with the proper basic message)
                          // Q&A no -> basic message - please, review your vaccine crendetials and try again later

                          // Ask for second vaccine
                          await AdminAPI.Connections.sendBasicMessage(
                            message.connection_id,
                            {
                              content:
                                "The second Moderna vaccine you've presented matches the first one. Please try again and present second vaccination credential.",
                            },
                          )

                          // Ask for second vaccine
                          await AdminAPI.Connections.sendBasicMessage(
                            message.connection_id,
                            {
                              content:
                                'Please, provide your second Moderna vaccination credential',
                            },
                          )

                          setTimeout(() => {
                            // Request presentation
                            requestPresentation(
                              message.connection_id,
                              'Vaccination',
                            )
                          }, 1000)
                        }
                        // If no match - check if the time between vaccine administration dates is at least 28 days
                        else {
                          console.log(
                            "First Moderna and second Pfizer vaccine credentials didn't match. Checking the 28 days time gap.",
                          )

                          console.log(
                            attributes.vaccine_administration_date.raw -
                              vaccineOne.dataValues.value.presentation
                                .attributes.vaccine_administration_date.raw,
                          )

                          if (
                            attributes.vaccine_administration_date.raw -
                              vaccineOne.dataValues.value.presentation
                                .attributes.vaccine_administration_date.raw >=
                            DateTime.local().plus({days: -28}).ts
                          ) {
                            console.log(
                              'The gap between 2 Moderna vaccines is less than 28 days. FAIL',
                            )

                            // Ask for second vaccine
                            await AdminAPI.Connections.sendBasicMessage(
                              message.connection_id,
                              {
                                content:
                                  'The time period between the first and the second Moderna vaccines must be more than 28 days. Please try again and present second vaccination credential.',
                              },
                            )

                            // Ask for second vaccine
                            await AdminAPI.Connections.sendBasicMessage(
                              message.connection_id,
                              {
                                content:
                                  'Please, provide your second Moderna vaccination credential',
                              },
                            )

                            setTimeout(() => {
                              // Request presentation
                              requestPresentation(
                                message.connection_id,
                                'Vaccination',
                              )
                            }, 1000)
                          } else {
                            console.log(
                              'The gap between 2 Moderna vaccines is more than 28 days. PASS',
                            )
                            // Create new credential row
                            const vaccineData = {
                              rules_pass: true,
                              presentation: {
                                attributes,
                                predicates,
                              },
                            }

                            await ConnectionsState.updateOrCreateConnectionState(
                              contact.Connections[0].dataValues.connection_id,
                              'vaccination_2',
                              vaccineData,
                            )
                          }
                        }
                      }

                      //  ----------Second vaccine issued earlier than 7 days ago----------
                      else if (
                        vaccineOne &&
                        !vaccineTwo &&
                        !vaccineThree &&
                        attributes.vaccine_administration_date.raw * 1000 >
                          DateTime.local().plus({days: -7}).ts
                      ) {
                        console.log(
                          'Second Moderna vaccine issued earlier than 7 days ago',
                        )

                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              "The second Moderna vaccine you've provided was issued earlier than 7 days ago. Please, try again",
                          },
                        )

                        // Ask for third vaccine
                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              'Please, provide your second Moderna vaccination credential',
                          },
                        )

                        setTimeout(() => {
                          // Call presentation request to start fresh
                          requestPresentation(
                            message.connection_id,
                            'Vaccination',
                          )
                        }, 1000)
                      }
                    }
                    // ------------------------MOD------------------------

                    // ------------------------PFR------------------------
                    if (attributes.vaccine_manufacturer_code.raw === 'PFR') {
                      console.log('Vaccine manufacturer Pfizer')

                      //  ----------Was first vaccine issued at least 35 days ago?----------
                      if (
                        !vaccineOne &&
                        !vaccineTwo &&
                        !vaccineThree &&
                        attributes.vaccine_administration_date.raw * 1000 <
                          DateTime.local().plus({days: -35}).ts
                      ) {
                        console.log(
                          'First vaccine was issued more than 35 days ago. PASS',
                        )

                        // Create new credential row
                        const vaccineData = {
                          rules_pass: true,
                          presentation: {
                            attributes,
                            predicates,
                          },
                        }

                        await ConnectionsState.updateOrCreateConnectionState(
                          contact.Connections[0].dataValues.connection_id,
                          'vaccination_1',
                          vaccineData,
                        )

                        // Ask for second vaccine
                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              'Please, provide your second Moderna vaccination credential',
                          },
                        )

                        setTimeout(() => {
                          // Request presentation
                          requestPresentation(
                            message.connection_id,
                            'Vaccination',
                          )
                        }, 1000)
                      }

                      //  ----------First vaccine issued earlier than 35 days ago----------
                      else if (
                        !vaccineOne &&
                        !vaccineTwo &&
                        !vaccineThree &&
                        attributes.vaccine_administration_date.raw * 1000 >
                          DateTime.local().plus({days: -35}).ts
                      ) {
                        console.log(
                          'First PFR vaccine issued earlier than 35 days ago',
                        )

                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              "The Pfizer vaccine you've provided was issued earlier than 35 days ago. Please, provide your first vaccination credential that is older than 35 days ago",
                          },
                        )

                        // Ask for second vaccine
                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              'Please, provide your first vaccination credential',
                          },
                        )

                        setTimeout(() => {
                          // Call presentation request to start fresh
                          requestPresentation(
                            message.connection_id,
                            'Vaccination',
                          )
                        }, 1000)
                      }

                      //  ----------Do we have second vaccine?----------
                      else if (
                        vaccineOne &&
                        !vaccineTwo &&
                        !vaccineThree &&
                        attributes.vaccine_administration_date.raw * 1000 <
                          DateTime.local().plus({days: -14}).ts
                      ) {
                        console.log('This is the second Pfizer vaccine')

                        // Check if attributes from the first vaccine match the presentation attributes
                        const vaccinesMatch = Util.deepEqual(
                          vaccineOne.dataValues.value.presentation.attributes,
                          attributes,
                        )

                        // If 100% match - first vaccine was presented again, send basic message
                        if (vaccinesMatch) {
                          console.log(
                            'The first and second Pfizer vaccines match',
                          )
                          // TODO: when swtiched to use governacne actions implement the logic below:
                          // Q&A - would you like to present a different credential?
                          // Q&A yes -> send a loop back and send the presentation request for the failed presentation (with the proper basic message)
                          // Q&A no -> basic message - please, review your vaccine crendetials and try again later

                          // Ask for second vaccine
                          await AdminAPI.Connections.sendBasicMessage(
                            message.connection_id,
                            {
                              content:
                                "The second Pfizer vaccine you've presented matches the first one. Please try again and present second vaccination credential.",
                            },
                          )

                          // Ask for second vaccine
                          await AdminAPI.Connections.sendBasicMessage(
                            message.connection_id,
                            {
                              content:
                                'Please, provide your second Pfizer vaccination credential',
                            },
                          )

                          setTimeout(() => {
                            // Request presentation
                            requestPresentation(
                              message.connection_id,
                              'Vaccination',
                            )
                          }, 1000)
                        }
                        // If no match - check if the time between vaccine administration dates is at least 21 days
                        else {
                          console.log(
                            "First Pfizer and second Pfizer vaccine credentials didn't match. Checking the 21 days time gap.",
                          )

                          console.log(
                            attributes.vaccine_administration_date.raw -
                              vaccineOne.dataValues.value.presentation
                                .attributes.vaccine_administration_date.raw,
                          )

                          if (
                            attributes.vaccine_administration_date.raw -
                              vaccineOne.dataValues.value.presentation
                                .attributes.vaccine_administration_date.raw >
                            DateTime.local().plus({days: -21}).ts
                          ) {
                            console.log(
                              'The gap between 2 Pfizer vaccines is less than 21 days. FAIL',
                            )

                            // Ask for second vaccine
                            await AdminAPI.Connections.sendBasicMessage(
                              message.connection_id,
                              {
                                content:
                                  'The time period between the first and the second Pfizer vaccines must be more than 21 days. Please try again and present second vaccination credential.',
                              },
                            )

                            // Ask for second vaccine
                            await AdminAPI.Connections.sendBasicMessage(
                              message.connection_id,
                              {
                                content:
                                  'Please, provide your second Pfizer vaccination credential',
                              },
                            )

                            setTimeout(() => {
                              // Request presentation
                              requestPresentation(
                                message.connection_id,
                                'Vaccination',
                              )
                            }, 1000)
                          } else {
                            console.log(
                              'The gap between 2 Pfizer vaccines is more than 21 days. PASS',
                            )
                            // Create new credential row
                            const vaccineData = {
                              rules_pass: true,
                              presentation: {
                                attributes,
                                predicates,
                              },
                            }

                            await ConnectionsState.updateOrCreateConnectionState(
                              contact.Connections[0].dataValues.connection_id,
                              'vaccination_2',
                              vaccineData,
                            )
                          }
                        }
                      }

                      //  ----------Second vaccine issued earlier than 7 days ago----------
                      else if (
                        vaccineOne &&
                        !vaccineTwo &&
                        !vaccineThree &&
                        attributes.vaccine_administration_date.raw * 1000 >
                          DateTime.local().plus({days: -7}).ts
                      ) {
                        console.log(
                          'Second Pfizer vaccine issued earlier than 7 days ago',
                        )

                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              "The second Pfizer vaccine you've provided was issued earlier than 7 days ago. Please, try again",
                          },
                        )

                        // Ask for third vaccine
                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              'Please, provide your second Pfizer vaccination credential',
                          },
                        )

                        setTimeout(() => {
                          // Call presentation request to start fresh
                          requestPresentation(
                            message.connection_id,
                            'Vaccination',
                          )
                        }, 1000)
                      }
                    }
                    // ------------------------PFR------------------------

                    // ------------------------JSN------------------------
                    if (attributes.vaccine_manufacturer_code.raw === 'JSN') {
                      console.log('Vaccine manufacturer Johnson')

                      //  ----------Was first vaccine issued at least 14 days ago?----------
                      if (
                        !vaccineOne &&
                        !vaccineTwo &&
                        !vaccineThree &&
                        attributes.vaccine_administration_date.raw * 1000 <
                          DateTime.local().plus({days: -14}).ts
                      ) {
                        console.log(
                          'First vaccine was issued more than 14 days ago. PASS',
                        )

                        // Create new credential row
                        const vaccineData = {
                          rules_pass: true,
                          presentation: {
                            attributes,
                            predicates,
                          },
                        }

                        await ConnectionsState.updateOrCreateConnectionState(
                          contact.Connections[0].dataValues.connection_id,
                          'vaccination_1',
                          vaccineData,
                        )
                      }

                      //  ----------First vaccine issued earlier than 14 days ago----------
                      else if (
                        !vaccineOne &&
                        !vaccineTwo &&
                        !vaccineThree &&
                        attributes.vaccine_administration_date.raw * 1000 >
                          DateTime.local().plus({days: -14}).ts
                      ) {
                        console.log(
                          'First Johnson & Johnson vaccine issued earlier than 14 days ago',
                        )

                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              "The Johnson & Johnson vaccine you've provided was issued earlier than 14 days ago. Please, provide your first vaccination credential that is older than 14 days ago",
                          },
                        )

                        // Ask for second vaccine
                        await AdminAPI.Connections.sendBasicMessage(
                          message.connection_id,
                          {
                            content:
                              'Please, provide your first vaccination credential',
                          },
                        )

                        setTimeout(() => {
                          // Call presentation request to start fresh
                          requestPresentation(
                            message.connection_id,
                            'Vaccination',
                          )
                        }, 1000)
                      }
                    }
                    // ------------------------JSN------------------------
                  }

                  // (eldersonar) ----------Yonger than 12----------
                  else {
                    console.log('Younger than 12')
                    await AdminAPI.Connections.sendBasicMessage(
                      message.connection_id,
                      {
                        content:
                          'Users younger than 12 years old are not requred to present vaccination proof.',
                      },
                    )
                  }

                  // Getting vaccine doses for final validation
                  console.log('Fetching first vaccine')
                  vaccineOne = await ConnectionsState.getConnectionStatesByKey(
                    contact.Connections[0].dataValues.connection_id,
                    'vaccination_1',
                  )

                  if (vaccineOne) {
                    console.log(vaccineOne)
                  }

                  console.log('Fetching second vaccine')
                  vaccineTwo = await ConnectionsState.getConnectionStatesByKey(
                    contact.Connections[0].dataValues.connection_id,
                    'vaccination_2',
                  )

                  if (vaccineTwo) {
                    console.log(vaccineTwo)
                  }

                  console.log('Fetching third vaccine')
                  vaccineThree = await ConnectionsState.getConnectionStatesByKey(
                    contact.Connections[0].dataValues.connection_id,
                    'vaccination_3',
                  )

                  if (vaccineThree) {
                    console.log(vaccineThree)
                  }

                  // 18+
                  let rulesPassed = false

                  if (
                    vaccineOne &&
                    vaccineOne.dataValues.value.presentation.attributes
                      .patient_date_of_birth.raw *
                      1000 <
                      DateTime.local().plus({years: -18}).ts
                  ) {
                    console.log('18+ years old')

                    if (
                      vaccineOne &&
                      vaccineOne.dataValues.value.presentation.attributes
                        .vaccine_manufacturer_code.raw === 'MOD' &&
                      vaccineTwo &&
                      vaccineTwo.dataValues.value.presentation.attributes
                        .vaccine_manufacturer_code.raw === 'MOD' &&
                      vaccineThree &&
                      vaccineThree.dataValues.value.presentation.attributes
                        .vaccine_manufacturer_code.raw === 'MOD'
                    ) {
                      credentialVerifiedAttributes = credentialAttributes
                      rulesPassed = true
                    } else if (
                      vaccineOne &&
                      vaccineOne.dataValues.value.presentation.attributes
                        .vaccine_manufacturer_code.raw === 'PFR' &&
                      vaccineTwo &&
                      vaccineTwo.dataValues.value.presentation.attributes
                        .vaccine_manufacturer_code.raw === 'PFR' &&
                      vaccineThree &&
                      vaccineThree.dataValues.value.presentation.attributes
                        .vaccine_manufacturer_code.raw === 'PFR'
                    ) {
                      credentialVerifiedAttributes = credentialAttributes
                      rulesPassed = true
                    } else if (
                      vaccineOne &&
                      vaccineOne.dataValues.value.presentation.attributes
                        .vaccine_manufacturer_code.raw === 'JSN' &&
                      vaccineTwo &&
                      vaccineTwo.dataValues.value.presentation.attributes
                        .vaccine_manufacturer_code.raw === 'JSN'
                    ) {
                      credentialVerifiedAttributes = credentialAttributes
                      rulesPassed = true
                    }
                  }

                  // 12-17
                  if (
                    vaccineOne &&
                    vaccineOne.dataValues.value.presentation.attributes
                      .patient_date_of_birth.raw *
                      1000 <
                      DateTime.local().plus({years: -12}).ts &&
                    vaccineOne.dataValues.value.presentation.attributes
                      .patient_date_of_birth.raw *
                      1000 >
                      DateTime.local().plus({years: -18}).ts
                  ) {
                    console.log('12 to 17 years old')

                    if (
                      vaccineOne &&
                      vaccineOne.dataValues.value.presentation.attributes
                        .vaccine_manufacturer_code.raw === 'MOD' &&
                      vaccineTwo &&
                      vaccineTwo.dataValues.value.presentation.attributes
                        .vaccine_manufacturer_code.raw === 'MOD'
                    ) {
                      credentialVerifiedAttributes = credentialAttributes
                      rulesPassed = true
                    } else if (
                      vaccineOne &&
                      vaccineOne.dataValues.value.presentation.attributes
                        .vaccine_manufacturer_code.raw === 'PFR' &&
                      vaccineTwo &&
                      vaccineTwo.dataValues.value.presentation.attributes
                        .vaccine_manufacturer_code.raw === 'PFR'
                    ) {
                      credentialVerifiedAttributes = credentialAttributes
                      rulesPassed = true
                    } else if (
                      vaccineOne &&
                      vaccineOne.dataValues.value.presentation.attributes
                        .vaccine_manufacturer_code.raw === 'JSN'
                    ) {
                      credentialVerifiedAttributes = credentialAttributes
                      rulesPassed = true
                    }
                  }

                  console.log(rulesPassed)
                  if (rulesPassed) {
                    // Update traveler's verification status
                    await Travelers.updateVerificationStatus(
                      contact.contact_id,
                      true,
                    )

                    console.log('Rules validation complete!')

                    await AdminAPI.Connections.sendBasicMessage(
                      message.connection_id,
                      {
                        content:
                          'Please return to your browser and press the "Continue" button to resume your ED Card application. You will receive your Happy Traveler credential when your application is complete.',
                      },
                    )
                  } else {
                    console.log(
                      'Rules validation failed or not all the requirments were presented!',
                    )

                    console.log("Vaccines didn't pass...")

                    await AdminAPI.Connections.sendBasicMessage(
                      message.connection_id,
                      {
                        content:
                          'Presentation of health proof using vaccinations failed. Please, try again and choose another vaccinations presentation.',
                      },
                    )

                    // Update traveler's verification status
                    await Travelers.updateVerificationStatus(
                      contact.contact_id,
                      false,
                    )
                  }
                }
                // This is the lab
                else if (contact.Traveler.dataValues.proof_type === 'Lab') {
                  console.log('Validating lab proof')

                  const labResult = attributes.lab_result.raw
                  const labCode = attributes.lab_code.raw
                  const labDate = attributes.lab_specimen_collected_date.raw
                  let rulesPassed = false

                  // a negative COVID-19 molecular test taken at most 3 days before departure
                  if (
                    labCode === 'MOL' &&
                    labResult == 'Negative' &&
                    labDate * 1000 > DateTime.local().plus({days: -3}).ts
                  ) {
                    credentialVerifiedAttributes = credentialAttributes
                    rulesPassed = true
                  }
                  // a negative COVID - 19 antigen test taken at most 1 day before departure
                  else if (
                    labCode === 'ANT' &&
                    labResult == 'Negative' &&
                    labDate * 1000 > DateTime.local().plus({days: -1}).ts
                  ) {
                    credentialVerifiedAttributes = credentialAttributes
                    rulesPassed = true
                  }
                  // a positive COVID - 19 molecular test issued at least 10 days and at most 12 weeks before arrival in Aruba.
                  else if (
                    labCode === 'MOL' &&
                    labResult == 'Positive' &&
                    labDate * 1000 < DateTime.local().plus({days: -10}).ts &&
                    labDate * 1000 > DateTime.local().plus({days: -84}).ts
                  ) {
                    credentialVerifiedAttributes = credentialAttributes
                    rulesPassed = true
                  } else {
                    console.log(
                      "The lab presentation didn't meet any of the requirements.",
                    )
                  }

                  console.log(rulesPassed)
                  if (rulesPassed) {
                    console.log('Rules validation complete!')

                    // Update traveler's verification status
                    await Travelers.updateVerificationStatus(
                      contact.contact_id,
                      true,
                    )

                    await AdminAPI.Connections.sendBasicMessage(
                      message.connection_id,
                      {
                        content: "We've verified your information.",
                      },
                    )

                    await AdminAPI.Connections.sendBasicMessage(
                      message.connection_id,
                      {
                        content:
                          'Please return to your browser and press the "Continue" button to resume your ED Card application. You will receive your Happy Traveler credential when your application is complete.',
                      },
                    )
                  } else {
                    console.log('Rules validation failed!')

                    console.log("Lab didn't pass...")

                    await AdminAPI.Connections.sendBasicMessage(
                      message.connection_id,
                      {
                        content:
                          'Presentation of health proof using lab failed. Please, try again and choose another lab presentation.',
                      },
                    )

                    // Update traveler's verification status
                    await Travelers.updateVerificationStatus(
                      contact.contact_id,
                      false,
                    )
                  }
                }
                // (eldersonar) Validation failed
              } else {
                console.log('')
                console.log('One or all the field comparison attempts failed.')
                console.log(
                  "The field comparison attempts failed while looping through input descriptor list. It can be just wrong descriptor or the list of attributes from the correct proof and fields from input descriptor didn't match.",
                )
                console.log('')
              }
            }
          }
        }
      }
    } else {
      // (eldersonar) Send a basic message
      console.log('Participant validation failed')
      await AdminAPI.Connections.sendBasicMessage(message.connection_id, {
        content:
          "We're sorry, but we don't currently recognize the issuer of your credential and cannot approve it at this time.",
      })
    }
  } else if (message.state === null) {
    // (mikekebert) Send a basic message saying the verification failed for technical reasons
    console.log('Validation failed for technical reasons')
    await AdminAPI.Connections.sendBasicMessage(message.connection_id, {
      content: 'UNVERIFIED',
    })
  } else {
  }
}

const createPresentationReports = async (presentation) => {
  try {
    const contact = await Contacts.getContactByConnection(
      presentation.connection_id,
    )

    const presentationReport = await Presentations.createPresentationReports(
      presentation.presentation_exchange_id,
      presentation.trace,
      presentation.connection_id,
      presentation.role,
      presentation.created_at,
      presentation.updated_at,
      JSON.stringify(presentation.presentation_request_dict),
      presentation.initiator,
      JSON.stringify(presentation.presentation_request),
      presentation.state,
      presentation.thread_id,
      presentation.auto_present,
      JSON.stringify(presentation.presentation),
      contact ? contact.label : '',
      contact ? contact.contact_id : '',
    )

    // Broadcast the message to all connections
    Websockets.sendMessageToAll('PRESENTATIONS', 'PRESENTATION_REPORTS', {
      presentation_reports: [presentationReport],
    })
  } catch (error) {
    console.log('Error creating presentation reports:')
    throw error
  }
}

const updatePresentationReports = async (presentation) => {
  try {
    let requestedPresentation = presentation.presentation

    // (AmmonBurgi) If our environment variable is equal to false, assign presentation to undefined so we don't store PHI attributes. Assigning it to undefined will prevent UI from breaking.
    if (process.env.ALLOW_PHI_ATTRIBUTES === 'false') {
      requestedPresentation = undefined
    }

    const contact = await Contacts.getContactByConnection(
      presentation.connection_id,
    )

    const presentationReport = await Presentations.updatePresentationReports(
      presentation.presentation_exchange_id,
      presentation.trace,
      presentation.connection_id,
      presentation.role,
      presentation.created_at,
      presentation.updated_at,
      JSON.stringify(presentation.presentation_request_dict),
      presentation.initiator,
      JSON.stringify(presentation.presentation_request),
      presentation.state,
      presentation.thread_id,
      presentation.auto_present,
      JSON.stringify(requestedPresentation),
      contact.label,
      contact.contact_id,
    )

    // Broadcast the message to all connections
    Websockets.sendMessageToAll('PRESENTATIONS', 'PRESENTATION_REPORTS', {
      presentation_reports: [presentationReport],
    })
  } catch (error) {
    console.log('Error updating presentation reports:')
    throw error
  }
}

const getAll = async () => {
  try {
    console.log('Fetching presentation reports!')
    let presentationReports = await Presentations.readPresentations()

    return presentationReports
  } catch (error) {
    console.log('Error fetching presentation reports:')
    throw error
  }
}

module.exports = {
  adminMessage,
  requestPresentation,
  requestIdentityPresentation,
  createPresentationReports,
  updatePresentationReports,
  getAll,
  requestSchemaPresentation,
}

const Contacts = require('./contacts')
