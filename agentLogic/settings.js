const ControllerError = require('../errors.js')

const AdminAPI = require('../adminAPI')

const Settings = require('../orm/settings')

//Perform Agent Business Logic

// Update the settings JSON
const setTheme = async (data = {}) => {
  try {
    await Settings.updateSetting('theme', data)
    const updatedTheme = await Settings.readSetting('theme')
    return updatedTheme
  } catch (error) {
    console.error('Error updating settings')
    throw error
  }
}

// UI asked for the settings JSON
const getTheme = async () => {
  try {
    const currentTheme = await Settings.readSetting('theme')
    return currentTheme
  } catch (error) {
    console.error('Error updating settings')
    throw error
  }
}

module.exports = {
  setTheme,
  getTheme,
}
