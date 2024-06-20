import inquirer from 'inquirer'

import ora, { type Ora } from 'ora'

import { Nvll } from 'environment'
import { randomReadableString } from 'helpers/common'
import { decryptAndSaveEmail } from 'helpers/symmetric'
import { chalk_error, chalk_success } from 'helpers/chalks'

/**
 * Fetches and decrypts a single S3 email.
 *
 * @returns {Promise<void>}
 */
const handler = async (): Promise<void> => {
  const { objectKey } = await inquirer.prompt([
    {
      type: 'input',
      name: 'objectKey',
      message: "Enter the S3 object key (or type '/r' to return):",
      validate: (input) => (input ? true : 'S3 object key is required.')
    }
  ])
  if (objectKey.toLowerCase() === '/r') return

  let shuffledString: string = chalk_error(`${Nvll.env.PREFIX}/${objectKey}`)

  const emailKey: string = `${Nvll.env.PREFIX}/${objectKey}`
  const spinner: Ora = ora(`Decrypting ${shuffledString}...`)
  spinner.color = 'red'
  spinner.start()

  const interval = setInterval(() => {
    shuffledString = randomReadableString(64)
    spinner.text = `Decrypting ${chalk_error(shuffledString)}...`
  }, 200)

  try {
    await decryptAndSaveEmail(emailKey)
  } catch (error) {
    clearInterval(interval)
    spinner.fail(chalk_error('Failed to decrypt and save.'))
    return
  }

  clearInterval(interval)
  spinner.succeed(chalk_success('Successfully received and saved.'))
}

export { handler }
