import { Command } from 'commander'
import { clear } from 'helpers/common'
import { chalk_error } from 'helpers/chalks'
import { initializeConfig } from 'environment'

import inquirer, { type Answers } from 'inquirer'

import { handler as handlerCheckNewEmails } from 'functions/checkNewEmails'
import { handler as handlerListLocalEmails } from 'functions/listLocalEmails'
import { handler as handlerOpenLocalEmail } from 'functions/openLocalEmail'
import { handler as handlerSearchLocalEmails } from 'functions/searchLocalEmails'
import { handler as handlerListS3Emails } from 'functions/listS3Emails'
import { handler as handlerFetchS3Email } from 'functions/fetchS3Email'
import { handler as handlerFetchAllS3Emails } from 'functions/fetchAllS3Emails'
import { handler as handlerEnvironments } from 'functions/environments'

/**
 * @description Renders the main menu and handles user input.
 * @returns {Promise<void>}
 */
const mainMenu = async (): Promise<void> => {
  const choices: Answers[] = [
    { name: 'Check for new emails', value: 'option_1' },
    { name: 'List local emails', value: 'option_2' },
    { name: 'Open email', value: 'option_3' },
    { name: 'Search emails by Sender/Subject', value: 'option_4' },
    { name: 'List S3 emails', value: 'option_5' },
    { name: 'Fetch an S3 email', value: 'option_6' },
    { name: 'Fetch all S3 emails', value: 'option_7' },
    { name: 'Environments', value: 'option_8' },
    { name: 'Exit', value: 'option_9' }
  ]

  /**
   * @description Handles the user's selected action.
   * @param {string} action - The selected action.
   * @returns {Promise<void>}
   */
  const mainMenuHandlerAction = async (action: string): Promise<void> => {
    switch (action) {
      case 'option_1':
        await handlerCheckNewEmails()
        break
      case 'option_2':
        await handlerListLocalEmails()
        break
      case 'option_3':
        await handlerOpenLocalEmail()
        break
      case 'option_4':
        await handlerSearchLocalEmails()
        break
      case 'option_5':
        await handlerListS3Emails()
        break
      case 'option_6':
        await handlerFetchS3Email()
        break
      case 'option_7':
        await handlerFetchAllS3Emails()
        break
      case 'option_8':
        await handlerEnvironments()
        break
      case 'option_9':
        await confirmExit()
        break
      default:
        console.error(chalk_error('Invalid option.'))
        break
    }
  }

  const { action } = await inquirer.prompt([{ type: 'list', name: 'action', message: 'What do you want to do?', choices }])

  await mainMenuHandlerAction(action)
  await mainMenu()
}

/**
 * @description Confirms if the user wants to exit the program.
 * @returns {Promise<void>} A promise that resolves when the user confirms the exit or when the menu is displayed.
 */
const confirmExit = async (): Promise<void> => {
  const answers: { confirmExit: boolean } = await inquirer.prompt([{ type: 'confirm', name: 'confirmExit' }])
  if (answers.confirmExit) {
    clear()
    console.error(chalk_error(`© ${new Date().getFullYear()} NVLL | https://nvll.me ------------\n`))
    process.exit(0)
  } else {
    clear()
    await mainMenu()
  }
}

const program: Command = new Command()

program
  .name('Serverless Mail')
  .description('Serverless email solution')
  .version('0.1.1')
  .description('Launch Serverless Mail')
  .action(async () => {
    clear()
    await initializeConfig()
    await mainMenu()
  })

program.parse(process.argv)

// Handle SIGINT (Ctrl+C) signal
process.on('SIGINT', async () => await confirmExit())
