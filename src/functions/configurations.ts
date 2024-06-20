import inquirer, { type Answers } from 'inquirer'

import { regions } from 'helpers/aws'
import { clear } from 'helpers/common'
import { chalk_error } from 'helpers/chalks'
import { Nvll, saveConfig } from 'environment'

/**
 * Validates the input for a given key.
 *
 * @param {string} input - The input to be validated.
 * @param {string} key - The key associated with the input.
 * @returns {boolean | string} - True if the input is valid, otherwise an error message.
 */
const validateInput = (input: string, key: string): boolean | string => {
  return key === 'REGION' || key === 'ACCESS_KEY_ID' || key === 'SECRET_ACCESS_KEY' || input.trim() ? true : 'Input cannot be empty.'
}

/**
 * Handles the configuration menu.
 *
 * @returns {Promise<void>} A Promise that resolves when the configuration menu is closed.
 */
const handler = async (): Promise<void> => {
  const choices: Answers[] = [
    { type: 'suggest', name: 'AWS Region', value: 'REGION', suggestions: regions },
    { type: 'password', name: 'AWS Access Key ID', value: 'ACCESS_KEY_ID', mask: true },
    { type: 'password', name: 'AWS Secret Access Key', value: 'SECRET_ACCESS_KEY', mask: true },
    { name: 'S3 Bucket Name', value: 'BUCKET_NAME' },
    { name: 'S3 Object Prefix', value: 'PREFIX' },
    { name: 'Local Mailbox Directory', value: 'LOCAL_MAILBOX_DIRECTORY' },
    { name: 'Return to Main Menu', value: '/r' }
  ]

  let action = ''
  inquirer.registerPrompt('suggest', require('inquirer-prompt-suggest'))
  while (action !== '/r') {
    const { action: selectedAction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What configuration do you want to set/update?',
        choices
      }
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
        mask: selectedChoice.mask,
        validate: (input) => validateInput(input, selectedChoice.value),
        ...(selectedChoice.type === 'suggest' ? { suggestions: selectedChoice.suggestions } : {})
      }
    ])

    if (input[selectedChoice.value].trim().toLowerCase() === '/r') continue

    const key = selectedChoice.value as keyof NvllEnv
    Nvll.env[key] = input[key] as NvllEnv['LOCAL_DEFAULT_ENCRYPTION_TYPE']
    saveConfig()
  }
}

export { handler }
