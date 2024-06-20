import ora, { type Ora } from 'ora'

import { clear, randomReadableString } from 'helpers/common'
import { chalk_error, chalk_success } from 'helpers/chalks'
import { s3EncryptedEmails, decryptAndSaveEmail } from 'helpers/symmetric'

/**
 * Fetches all S3 emails and decrypts them, saving them locally.
 *
 * @returns {Promise<void>}
 */
const handler = async (): Promise<void> => {
  try {
    const s3Emails = await s3EncryptedEmails()
    for (const email of s3Emails) {
      let shuffledString: string = chalk_error(email.Key)

      const spinner: Ora = ora(`Decrypting ${shuffledString}...`)
      spinner.color = 'red'
      spinner.start()
      const interval = setInterval(() => {
        shuffledString = randomReadableString(64)
        spinner.text = `Decrypting ${chalk_error(shuffledString)}...`
      }, 200)

      await decryptAndSaveEmail(email.Key)

      clearInterval(interval)
      spinner.succeed(chalk_success('Successfully received and saved.'))
    }
    clear()
    console.log(chalk_success('Successfully received and saved all emails.'))
  } catch (error: any) {
    console.error(chalk_error(`Error receiving all emails: ${error.message}`))
  }
}

export { handler }
