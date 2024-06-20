import path from 'path'
import inquirer from 'inquirer'

import { regions } from 'helpers/aws'
import { clear } from 'helpers/common'
import { configTable } from 'helpers/table'
import { Nvll, saveConfig } from 'environment'
import { table, type TableUserConfig } from 'table'
import { chalk_error, chalk_info } from 'helpers/chalks'

/**
 * @description Validates the input for a given key.
 * @param {string} input - The input to be validated.
 * @returns {boolean | string} - True if the input is valid, otherwise an error message.
 */
const validateInput = (input: string): boolean | string => (input.trim() ? true : 'Input cannot be empty.')

/**
 * @description Handles the environment menu.
 * @returns {Promise<void>} A Promise that resolves when the environment menu is closed.
 */
const handler = async (): Promise<void> => {
  const choices = [
    { type: 'list', name: 'AWS Region', value: 'REGION', choices: regions },
    {
      type: 'input',
      name: 'AWS Access Key ID',
      value: 'ACCESS_KEY_ID',
      validate: (input: string) => validateInput(input || (Nvll.env.ACCESS_KEY_ID as string))
    },
    {
      type: 'input',
      name: 'AWS Secret Access Key',
      value: 'SECRET_ACCESS_KEY',
      validate: (input: string) => validateInput(input || (Nvll.env.SECRET_ACCESS_KEY as string))
    },
    {
      type: 'input',
      name: 'S3 Bucket Name',
      value: 'BUCKET_NAME',
      validate: (input: string) => validateInput(input)
    },
    {
      type: 'input',
      name: 'S3 Object Prefix',
      value: 'PREFIX',
      validate: (input: string) => validateInput(input)
    },
    {
      type: 'input',
      name: 'Local Mailbox Directory',
      value: 'LOCAL_MAILBOX_DIRECTORY',
      /**
       * @description Validates the input for a local mailbox directory.
       * @param {string} input - The input to be validated.
       * @returns {boolean | string} - True if the input is valid, otherwise an error message.
       */
      validate: (input: string): boolean | string => {
        return (input.trim() && path.isAbsolute(input.trim())) || /^[\w\-/.\\.]+$/.test(input.trim()) ? true : 'Input cannot be empty or invalid.'
      }
    },
    { type: 'input', name: 'Return to Main Menu', value: '/r' }
  ]

  inquirer.registerPrompt('suggest', require('inquirer-prompt-suggest'))

  let action = ''
  while (action !== '/r') {
    clear()
    const columns: TableUserConfig['columns'] = [...Array(6).fill({ alignment: 'left' })]
    const dataEnvironments = [
      [
        chalk_info('Region'),
        chalk_info('Access Key ID'),
        chalk_info('AWS Secret Access Key'),
        chalk_info('S3 Bucket Name'),
        chalk_info('S3 Object Prefix'),
        chalk_info('Local Mailbox Directory')
      ],
      [Nvll.env.REGION, Nvll.env.ACCESS_KEY_ID, Nvll.env.SECRET_ACCESS_KEY, Nvll.env.BUCKET_NAME, Nvll.env.PREFIX, Nvll.env.LOCAL_MAILBOX_DIRECTORY]
    ]

    console.log(table(dataEnvironments, configTable(columns)))

    const { action: selectedAction } = await inquirer.prompt([
      { type: 'list', name: 'action', message: 'What environment do you want to set/update?', choices }
    ])

    action = selectedAction

    if (action === '/r') {
      clear()
      break
    }

    const selectedChoice = choices.find((choice) => choice.value === action)
    if (!selectedChoice) {
      console.error(chalk_error('Invalid choice.'))
      continue
    }

    const defaultValue = selectedChoice.value in Nvll.env ? Nvll.env[selectedChoice.value as keyof NvllEnv] : ''
    const input = await inquirer.prompt([
      {
        type: selectedChoice.type,
        name: selectedChoice.value,
        message: selectedChoice.name,
        default: defaultValue,
        ...(selectedChoice.type === 'list' ? { choices: selectedChoice.choices } : {}),
        validate: selectedChoice.validate
      }
    ])

    if (input[selectedChoice.value].trim().toLowerCase() === '/r') continue

    const key = selectedChoice.value as keyof NvllEnv
    Nvll.env[key] = input[key] as NvllEnv['LOCAL_DEFAULT_ENCRYPTION_TYPE']
    saveConfig()
  }
}

export { handler }
