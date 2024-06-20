import path from 'path'

import ora, { type Ora } from 'ora'

import { Nvll } from 'environment'
import { existsSync, mkdirSync } from 'fs'
import { chalk_error, chalk_success } from 'helpers/chalks'
import { clear, randomReadableString } from 'helpers/common'
import { s3EncryptedEmails, decryptAndSaveEmail } from 'helpers/symmetric'

/**
 * @description Fetches all S3 emails and decrypts them, saving them locally.
 * @returns {Promise<void>}
 */
const handler = async (): Promise<void> => {
  const mailboxDir = path.resolve(Nvll.env.LOCAL_MAILBOX_DIRECTORY || '')
  if (!existsSync(mailboxDir)) mkdirSync(mailboxDir)

  const spinLog: Ora = ora()
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
    spinLog.succeed(chalk_success('Successfully received and saved all emails.'))
  } catch (error: any) {
    spinLog.fail(chalk_error(`Error receiving all emails: ${error.message}`))
  }
}

export { handler }
