const crypto = require('crypto')
const Settings = require('../orm/settings')
const Util = require('../util')

// Perform Agent Business Logic

// Theme
const setTheme = async (data = {}) => {
  try {
    await Settings.updateTheme(data)
    const updatedTheme = await Settings.readTheme()
    return updatedTheme
  } catch (error) {
    console.error('Error updating settings')
    throw error
  }
}

const getTheme = async () => {
  try {
    const currentTheme = await Settings.readTheme()
    return currentTheme
  } catch (error) {
    console.error('Error getting Theme')
    throw error
  }
}

// SMTP
const getSMTP = async () => {
  try {
    const currentSMTP = await Settings.readSMTP()
    return currentSMTP
  } catch (error) {
    console.error('Error getting SMTP')
    throw error
  }
}

const setSMTP = async (data = {}) => {
  try {
    if (!data.auth.email || !data.auth.mailUsername || !data.host) {
      return false
    } else {
      const oldSMTP = await getSMTP()
      const IV = crypto.randomBytes(8).toString('hex')

      // If no password was provided in the form but there is already password in our database
      if (
        (!data.auth.pass || data.auth.pass === '************') &&
        oldSMTP.value &&
        oldSMTP.value.auth.pass
      ) {
        console.log('No password was provided')
        data.auth.pass = oldSMTP.value.auth.pass
        data.IV = oldSMTP.value.IV
      } else {
        console.log('Password was provided')
        const encryptedPassword = Util.encrypt(data.auth.pass, IV)
        data.IV = IV
        data.auth.pass = encryptedPassword
      }

      await Settings.updateSMTP(data)
      const updatedSMTP = await Settings.readSMTP()
      return updatedSMTP
    }
  } catch (error) {
    console.error('Error updating SMTP')
    throw error
  }
}

// Organization
const getOrganization = async () => {
  try {
    const currentOrganization = await Settings.readOrganization()
    return currentOrganization
  } catch (error) {
    console.error('Error getting Organization')
    throw error
  }
}

const setOrganization = async (data = {}) => {
  try {
    await Settings.updateOrganization(data)
    const updatedOrganization = await Settings.readOrganization()
    return updatedOrganization
  } catch (error) {
    console.error('Error updating organization name')
    throw error
  }
}

const setManifest = async (short_name, name, theme_color, bg_color) => {
  try {
    const manifest = {
      short_name: short_name,
      name: name,
      icons: [
        {
          src: 'favicon.ico',
          sizes: '64x64 32x32 24x24 16x16',
          type: 'image/x-icon',
        },
        {
          src: 'icon192.png',
          type: 'image/png',
          sizes: '192x192',
        },
        {
          src: 'icon512.png',
          type: 'image/png',
          sizes: '512x512',
        },
      ],
      start_url: '.',
      display: 'standalone',
      theme_color: theme_color,
      background_color: bg_color,
    }

    await Settings.updateManifest(manifest)

    return 'success'
  } catch (error) {
    console.error('Error updating manifest.json')
    throw error
  }
}

const getManifest = async () => {
  try {
    const manifest = await Settings.readManifest()
    return manifest
  } catch (error) {
    console.error('Error getting Manifest')
    throw error
  }
}

const getSchemas = async () => {
  return {
    SCHEMA_TRUSTED_TRAVELER: process.env.SCHEMA_TRUSTED_TRAVELER,
  }
}

module.exports = {
  getTheme,
  setTheme,
  getSMTP,
  setSMTP,
  getOrganization,
  setOrganization,
  getManifest,
  setManifest,
  getSchemas,
}
