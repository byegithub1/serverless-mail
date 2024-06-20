import dateFormat from 'helpers/date'

import ora, { type Ora } from 'ora'

import { Nvll } from 'environment'
import { clear } from 'helpers/common'
import { configTable } from 'helpers/table'
import { table, type TableUserConfig } from 'table'
import { s3EncryptedEmails } from 'helpers/symmetric'
import { chalk_error, chalk_info, chalk_success } from 'helpers/chalks'

/**
 * Lists the S3 emails in a table format.
 *
 * @returns {Promise<void>}
 */
const handler = async (): Promise<void> => {
  clear()
  const spinner: Ora = ora('Fetching emails...')
  spinner.color = 'red'

  try {
    spinner.start()
    const s3Emails = await s3EncryptedEmails()

    if (s3Emails.length >= 1) {
      const columns: TableUserConfig['columns'] = [{ alignment: 'left' }, { alignment: 'left' }]
      const dataEmails: unknown[][] = [
        [chalk_info('S3 Object Key'), chalk_info('Last Modified')],
        ...s3Emails.map(({ Key, LastModified }): unknown[] => [
          chalk_success(Key.replace(`${Nvll.env.PREFIX}/`, '')) as string,
          chalk_success(LastModified ? dateFormat.simple(LastModified) : 'N/A')
        ])
      ]

      spinner.succeed(`${chalk_success('Emails found:')} (${chalk_info(s3Emails.length)})`)
      console.log(table(dataEmails, configTable(columns)))
    } else spinner.fail(chalk_error('No emails found.'))
  } catch (error: any) {
    spinner.fail(chalk_error(`Error checking for new emails: ${error.message}`))
  }
}

export { handler }
