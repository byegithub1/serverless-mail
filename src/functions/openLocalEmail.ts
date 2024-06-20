import path from 'path'
import inquirer from 'inquirer'
import Aes256 from 'helpers/aes256'
import Hexadecimal from 'helpers/hexadecimal'

import { Nvll } from 'environment'
import { simpleParser } from 'mailparser'
import { chalk_error } from 'helpers/chalks'
import { clear, openFile } from 'helpers/common'
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs'

/**
 * Waits for the user to press Enter to continue.
 *
 * @returns {Promise<void>}
 */
const waitForUser = async (): Promise<void> => {
  await inquirer.prompt([
    {
      type: 'input',
      name: 'continue',
      message: 'Press Enter to continue (temporary files will be deleted)...'
    }
  ])
}

/**
 * Opens a local email based on its S3 object key.
 *
 * @returns {Promise<void>}
 */
const handler = async (): Promise<void> => {
  try {
    const { objectKey: localObjectKey } = await inquirer.prompt([
      {
        type: 'input',
        name: 'objectKey',
        message: "Enter the S3 object key (or type '/r' to return):",
        validate: (input) => !!input || 'S3 object key is required.'
      }
    ])

    if (localObjectKey.toLowerCase() === '/r') {
      clear()
      return
    }

    const { LOCAL_MAILBOX_DIRECTORY, LOCAL_DEFAULT_ENCRYPTION, LOCAL_DEFAULT_ENCRYPTION_TYPE, LOCAL_DEFAULT_ENCRYPTION_KEY } = Nvll.env

    if (!LOCAL_MAILBOX_DIRECTORY) {
      console.error(chalk_error('Email file path is not configured.'))
      return
    }

    const emailFilePath = path.join(LOCAL_MAILBOX_DIRECTORY, `${localObjectKey}.eml`)

    if (!existsSync(emailFilePath)) {
      console.error(chalk_error(`Email file ${emailFilePath} does not exist.`))
      return
    }

    const fileContent = readFileSync(emailFilePath, 'utf8')

    if (LOCAL_DEFAULT_ENCRYPTION && LOCAL_DEFAULT_ENCRYPTION_TYPE && LOCAL_DEFAULT_ENCRYPTION_KEY) {
      try {
        const key = Hexadecimal.hexToUint8Array(LOCAL_DEFAULT_ENCRYPTION_KEY)
        const encryptedEmail = Hexadecimal.reverseHexDump(fileContent)

        if (encryptedEmail) {
          const decryptedEmail = await Aes256.decrypt(encryptedEmail, key, LOCAL_DEFAULT_ENCRYPTION_TYPE)
          const tempEmailFilePath = path.resolve(LOCAL_MAILBOX_DIRECTORY, '..', '.email-temp.eml')

          writeFileSync(tempEmailFilePath, decryptedEmail, 'utf8')
          const { from } = await simpleParser(decryptedEmail)
          const sender: string = `${from?.value[0].name} <${from?.value[0].address}>`
          console.error(
            chalk_error(`\nClose the program that opened the email,\nthere is an unencrypted temporary file containing emails from ${sender}.\n`)
          )

          await openFile(tempEmailFilePath)
          await waitForUser()
          unlinkSync(tempEmailFilePath)
          clear()
          return
        }
      } catch (error: any) {
        console.error(chalk_error(`Error decrypting the email: ${error.message}`))
        return
      }
    }

    await openFile(emailFilePath)
    clear()
  } catch (error: any) {
    console.error(chalk_error(`An unexpected error occurred: ${error.message}`))
  }
}

export { handler }
