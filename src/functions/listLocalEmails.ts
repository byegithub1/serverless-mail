import path from 'path'
import Aes256 from 'helpers/aes256'
import dateFormat from 'helpers/date'
import Hexadecimal from 'helpers/hexadecimal'

import ora, { type Ora } from 'ora'

import { Nvll } from 'environment'
import { clear } from 'helpers/common'
import { simpleParser } from 'mailparser'
import { configTable } from 'helpers/table'
import { table, type TableUserConfig } from 'table'
import { existsSync, readdirSync, readFileSync, mkdirSync } from 'fs'
import { chalk_error, chalk_info, chalk_success } from 'helpers/chalks'

/**
 * Reads and parses local emails.
 *
 * @returns {Promise<EmailData[]>} An array of parsed emails.
 */
const readLocalEmails = async (): Promise<EmailData[]> => {
  const mailboxDir = path.resolve(Nvll.env.LOCAL_MAILBOX_DIRECTORY || '')
  if (!existsSync(mailboxDir)) mkdirSync(mailboxDir)

  const emailFiles: string[] = readdirSync(mailboxDir).filter((file: string) => file.endsWith('.eml'))
  const emails = await Promise.all(
    emailFiles.map(async (file: string) => {
      try {
        const filePath = path.join(mailboxDir, file)
        const emailContent = readFileSync(filePath, 'utf8')

        let decryptedContent = emailContent
        if (Nvll.env.LOCAL_DEFAULT_ENCRYPTION && Nvll.env.LOCAL_DEFAULT_ENCRYPTION_TYPE && Nvll.env.LOCAL_DEFAULT_ENCRYPTION_KEY) {
          const key = Hexadecimal.hexToUint8Array(Nvll.env.LOCAL_DEFAULT_ENCRYPTION_KEY)
          const encryptedEmail = Hexadecimal.reverseHexDump(emailContent)
          if (encryptedEmail) decryptedContent = await Aes256.decrypt(encryptedEmail as string, key, Nvll.env.LOCAL_DEFAULT_ENCRYPTION_TYPE)
        }

        const parsedEmail = await simpleParser(decryptedContent)
        const result: EmailData = {
          ObjectKey: file.replace('.eml', ''),
          From: parsedEmail.from?.text.replace(/"/g, '') || 'N/A',
          Received: parsedEmail.date ? new Date(parsedEmail.date) : new Date(0),
          Subject: parsedEmail.subject || 'N/A',
          Attachments: parsedEmail.attachments || []
        }

        if (result.From === 'N/A' && result.Subject === 'N/A') throw new Error('Invalid cipher text format.')

        return result
      } catch (error: any) {
        return {
          ObjectKey: file.replace('.eml', ''),
          Subject: 'Error retrieving subject',
          Error: error.message,
          Received: new Date(0)
        }
      }
    })
  )

  return emails.sort((a, b) => (b.Received?.getTime() || 0) - (a.Received?.getTime() || 0)) as EmailData[]
}

/**
 * Lists the locally stored emails in a table format.
 *
 * @returns {Promise<void>} A promise that resolves when the emails are listed.
 */
const handler = async (): Promise<void> => {
  clear()
  const spinner: Ora = ora('Reading local emails...')
  spinner.color = 'red'
  try {
    spinner.start()
    const localEmails: EmailData[] = await readLocalEmails()

    if (localEmails.length >= 1) {
      const columns: TableUserConfig['columns'] = [
        { alignment: 'left' },
        { alignment: 'left' },
        { alignment: 'left' },
        { alignment: 'left' },
        { alignment: 'center' }
      ]
      const dataEmails: unknown[][] = [
        [chalk_info('S3 Object Key'), chalk_info('From'), chalk_info('Received'), chalk_info('Subject'), chalk_info('Attachments')],
        ...localEmails.map(({ ObjectKey, From, Received, Subject, Attachments, Error }: EmailData): unknown[] => [
          chalk_success(ObjectKey) as string,
          Error ? 'N/A' : From || 'N/A',
          Error ? 'N/A' : Received ? dateFormat.simple(Received) : 'N/A',
          Error ? 'N/A' : Subject && Subject.length > 64 ? Subject.substring(0, 64) + '...' : Subject || 'N/A',
          Error ? 'N/A' : Attachments.length ? 'Available' : 'N/A'
        ])
      ]

      spinner.succeed(`${chalk_success('Emails found:')} (${chalk_info(localEmails.length)})`)
      console.log(table(dataEmails, configTable(columns)))
    } else spinner.fail(chalk_error('No emails found.'))
  } catch (error: any) {
    spinner.fail(chalk_error(`An error occurred: ${error.message}`))
  }
}

export { handler, readLocalEmails }
