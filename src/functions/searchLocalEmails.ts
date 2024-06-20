import inquirer from 'inquirer'
import dateFormat from 'helpers/date'

import ora, { type Ora } from 'ora'

import { clear } from 'helpers/common'
import { configTable } from 'helpers/table'
import { table, type TableUserConfig } from 'table'
import { readLocalEmails } from 'functions/listLocalEmails'
import { chalk_error, chalk_info, chalk_success } from 'helpers/chalks'

/**
 * Searches for local emails based on sender and subject.
 *
 * @param {string | undefined} from - The email sender to search for (case-insensitive).
 * @param {string | undefined} subject - The email subject to search for (case-insensitive).
 * @returns {Promise<EmailData[]>} An array of emails matching the search criteria.
 */
const searchLocalEmails = async (from: string | undefined, subject: string | undefined): Promise<EmailData[]> => {
  const localEmails: EmailData[] = await readLocalEmails()
  return localEmails.filter((email) => {
    const fromMatch = from ? (email.From ? email.From.toLowerCase().includes(from.toLowerCase()) : false) : true
    const subjectMatch = subject ? email.Subject.toLowerCase().includes(subject.toLowerCase()) : true
    return fromMatch && subjectMatch
  })
}

/**
 * Searches for local emails based on sender and subject.
 *
 * @returns {Promise<void>}
 */
const handler = async (): Promise<void> => {
  clear()
  const spinner: Ora = ora('Searching for emails...')
  spinner.color = 'red'
  try {
    const { from, subject } = await inquirer.prompt([
      { type: 'input', name: 'from', message: 'Enter the email sender to search (leave blank to ignore):' },
      { type: 'input', name: 'subject', message: 'Enter the email subject to search (leave blank to ignore):' }
    ])
    spinner.start()
    const foundEmails = await searchLocalEmails(from, subject)
    if (foundEmails.length) {
      clear()
      const columns: TableUserConfig['columns'] = [
        { alignment: 'left' },
        { alignment: 'left' },
        { alignment: 'left' },
        { alignment: 'left' },
        { alignment: 'center' }
      ]
      const dataEmails: unknown[][] = [
        [chalk_info('S3 Object Key'), chalk_info('From'), chalk_info('Received'), chalk_info('Subject'), chalk_info('Attachments')],
        ...foundEmails.map(({ ObjectKey, From, Received, Subject, Attachments }: EmailData): unknown[] => [
          chalk_success(ObjectKey) as string,
          From || 'N/A',
          Received ? dateFormat.simple(Received) : 'N/A',
          Subject && Subject.length > 64 ? Subject.substring(0, 64) + '...' : Subject || 'N/A',
          Attachments.length ? 'Available' : 'N/A'
        ])
      ]

      spinner.succeed(`${chalk_success('Emails found:')} (${chalk_info(foundEmails.length)})`)
      console.log(table(dataEmails, configTable(columns)))
    } else {
      clear()
      spinner.fail(chalk_error('No emails found.'))
    }
  } catch (error: any) {
    spinner.fail(chalk_error(`Error checking for new emails: ${error.message}`))
  }
}

export { handler }
