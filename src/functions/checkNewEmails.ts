import dateFormat from 'helpers/date'

import ora, { type Ora } from 'ora'

import { Nvll } from 'environment'
import { configTable } from 'helpers/table'
import { table, type TableUserConfig } from 'table'
import { s3EncryptedEmails } from 'helpers/symmetric'
import { readLocalEmails } from 'functions/listLocalEmails'
import { clear, randomReadableString } from 'helpers/common'
import { chalk_error, chalk_info, chalk_success } from 'helpers/chalks'

/**
 * @description Checks for new emails by comparing the S3 emails with the locally stored emails.
 * @returns {Promise<void>}
 */
const handler = async (): Promise<void> => {
  clear()
  const spinner: Ora = ora('Checking for new emails...')
  spinner.color = 'red'
  try {
    spinner.start()
    const [s3Emails, localEmails] = await Promise.all([s3EncryptedEmails(), readLocalEmails()])
    const newEmails = s3Emails.filter((s3Email) => !localEmails.some((localEmail) => s3Email.Key.includes(localEmail.ObjectKey)))

    if (newEmails.length >= 1) {
      const columns: TableUserConfig['columns'] = [...Array(5).fill({ alignment: 'left' }), { alignment: 'center' }]
      const newDataEmails: unknown[][] = [
        [
          chalk_info('Last Modified'),
          chalk_info('S3 Object Key'),
          chalk_info('From'),
          chalk_info('Received'),
          chalk_info('Subject'),
          chalk_info('Attachments')
        ],
        ...newEmails.map(({ Key, LastModified }): unknown[] => [
          chalk_success(LastModified ? dateFormat.simple(LastModified) : 'N/A') as string,
          chalk_success(Key.replace(`${Nvll.env.PREFIX}/`, '')) as string,
          chalk_error(randomReadableString(32)),
          chalk_error('0000-00-00 00:00:00'),
          chalk_error(randomReadableString(128)),
          chalk_error('N/A')
        ])
      ]

      spinner.succeed(`${chalk_success('New Emails found:')} (${chalk_info(newDataEmails.length)})`)
      console.log(table(newDataEmails, configTable(columns)))
    } else spinner.fail(chalk_error('No new emails found.'))
  } catch (error: any) {
    spinner.fail(chalk_error(`Error checking for new emails: ${error.message}`))
  }
}

export { handler }
