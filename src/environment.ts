import os from 'os'
import path from 'path'
import dotenv from 'dotenv'

import inquirer, { type Answers } from 'inquirer'

import { clear } from 'helpers/common'
import { S3Client } from '@aws-sdk/client-s3'
import { KMSClient } from '@aws-sdk/client-kms'
import { chalk_error, chalk_info } from 'helpers/chalks'
import { existsSync, writeFileSync, mkdirSync } from 'fs'
import { regions, awsConfig, awsCredentials } from 'helpers/aws'
import { randomSharedKey, randomSharedKeys } from 'helpers/elliptic'

const nvllEnvFolder = '.nvll'
const nvllEnvFile = '.env'

const envDirPath = path.join(os.homedir(), nvllEnvFolder)
const envPath = path.join(envDirPath, nvllEnvFile)

dotenv.config({ path: envPath })

const defaultRegion = awsConfig['default']?.region || ''
const defaultAccessKeyId = awsCredentials['default']?.aws_access_key_id || ''
const defaultSecretAccessKey = awsCredentials['default']?.aws_secret_access_key || ''

const Nvll: Nvll = {
  env: {
    REGION: process.env.REGION || defaultRegion || undefined,
    ACCESS_KEY_ID: process.env.ACCESS_KEY_ID || defaultAccessKeyId || undefined,
    SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY || defaultSecretAccessKey || undefined,
    BUCKET_NAME: process.env.BUCKET_NAME || undefined,
    PREFIX: process.env.PREFIX || undefined,
    LOCAL_MAILBOX_DIRECTORY: process.env.LOCAL_MAILBOX_DIRECTORY || path.join(os.homedir(), nvllEnvFolder, 'mailbox') || undefined,
    LOCAL_DEFAULT_ENCRYPTION: process.env.LOCAL_DEFAULT_ENCRYPTION || undefined,
    LOCAL_DEFAULT_ENCRYPTION_TYPE: process.env.LOCAL_DEFAULT_ENCRYPTION_TYPE as NvllEnv['LOCAL_DEFAULT_ENCRYPTION_TYPE'],
    LOCAL_DEFAULT_ENCRYPTION_KEY: process.env.LOCAL_DEFAULT_ENCRYPTION_KEY || randomSharedKey(),
    CIPHER_DELIMITER: 'f1f69ebc4e564c4c2d454e56454c4f5045bc9ef6f1'
  }
}

let s3Client: S3Client
let kmsClient: KMSClient

/**
 * @description Loads the environment from the environment variables and initializes the clients.
 * @returns {Promise<void>} A promise that resolves when the environment is loaded and the clients are initialized.
 */
const loadConfig = async (): Promise<void> => {
  dotenv.config({ path: envPath })
  initializeClients()
}

/**
 * @description Saves the environment to the .env file and initializes the clients.
 * @returns {Promise<void>} A promise that resolves when the environment is saved and the clients are initialized.
 */
const saveConfig = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      if (!existsSync(envDirPath)) mkdirSync(envDirPath)
      const envConfig: string = Object.entries(Nvll.env)
        .map(([key, value]: [string, string | undefined]): string => `${key}=${value}`)
        .join('\n')

      writeFileSync(envPath, envConfig, 'utf8')
      dotenv.config({ path: envPath })
      initializeClients()
      resolve()
    } catch (error: any) {
      console.error(chalk_error(`Error saving config to .env file: ${error.message}`))
      reject(error)
    }
  })
}

/**
 * @description Initializes the S3 and KMS clients with the provided environment.
 * @returns {void}
 */
const initializeClients = (): void => {
  const { REGION, ACCESS_KEY_ID, SECRET_ACCESS_KEY } = Nvll.env
  const credentials = ACCESS_KEY_ID && SECRET_ACCESS_KEY ? { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY } : undefined
  s3Client = new S3Client({ region: REGION, credentials })
  kmsClient = new KMSClient({ region: REGION, credentials })
}

/**
 * @description Validates the input for a given key.
 * @param {string} input - The input to be validated.
 * @returns {boolean | string} - True if the input is valid, otherwise an error message.
 */
const validateInput = (input: string): boolean | string => (input.trim() ? true : 'Input cannot be empty.')

/**
 * @description Prompts the user for environment inputs.
 * @returns {Promise<void>} A promise that resolves when the environment is prompted and saved.
 */
const promptEnvironments = async (): Promise<void> => {
  const choices: Answers[] = [
    {
      type: 'suggest',
      name: 'REGION',
      message: 'AWS Region (aws-cli configured? leave it blank):',
      default: Nvll.env.REGION,
      suggestions: regions,
      validate: (input: string) => validateInput(input)
    },
    {
      type: 'input',
      name: 'ACCESS_KEY_ID',
      message: 'AWS Access Key ID (aws-cli configured? leave it blank):',
      default: Nvll.env.ACCESS_KEY_ID,
      masked: true,
      validate: (input: string) => validateInput(input || (Nvll.env.ACCESS_KEY_ID as string))
    },
    {
      type: 'input',
      name: 'SECRET_ACCESS_KEY',
      message: 'AWS Secret Access Key (aws-cli configured? leave it blank):',
      default: Nvll.env.SECRET_ACCESS_KEY,
      masked: true,
      validate: (input: string) => validateInput(input || (Nvll.env.SECRET_ACCESS_KEY as string))
    },
    {
      type: 'input',
      name: 'BUCKET_NAME',
      message: 'AWS S3 Bucket Name (e.g. nvll):',
      default: Nvll.env.BUCKET_NAME,
      validate: (input: string) => validateInput(input)
    },
    {
      type: 'input',
      name: 'PREFIX',
      message: 'AWS S3 Object Prefix (e.g. ses/nvll.me-mailbox):',
      default: Nvll.env.PREFIX,
      validate: (input: string) => validateInput(input)
    },
    {
      type: 'input',
      name: 'LOCAL_MAILBOX_DIRECTORY',
      message: 'Local Mailbox Directory (e.g. mailbox):',
      default: Nvll.env.LOCAL_MAILBOX_DIRECTORY,
      /**
       * @description Validates the input for a local mailbox directory.
       * @param {string} input - The input to be validated.
       * @returns {boolean | string} - True if the input is valid, otherwise an error message.
       */
      validate: (input: string): boolean | string => {
        return (input.trim() && path.isAbsolute(input.trim())) || /^[\w\-/.\\.]+$/.test(input.trim()) ? true : 'Input cannot be empty or invalid.'
      }
    },
    {
      type: 'confirm',
      name: 'LOCAL_DEFAULT_ENCRYPTION',
      message: 'Local mailbox encryption (recommended):',
      default: Nvll.env.LOCAL_DEFAULT_ENCRYPTION
    },
    {
      type: 'list',
      name: 'LOCAL_DEFAULT_ENCRYPTION_TYPE',
      message: 'Choose encryption type:',
      choices: ['AES-GCM', 'AES-CTR', 'AES-CBC'],
      default: Nvll.env.LOCAL_DEFAULT_ENCRYPTION_TYPE,
      when: (answers: Answers) => answers.LOCAL_DEFAULT_ENCRYPTION
    },
    {
      type: 'suggest',
      name: 'LOCAL_DEFAULT_ENCRYPTION_KEY',
      message: 'Your Private Key (leave blank to use a secure random key):',
      default: () => Nvll.env.LOCAL_DEFAULT_ENCRYPTION_KEY || randomSharedKey(),
      /**
       * @description Validates if the input is a hexadecimal string with a length of 64 characters.
       * @param {string} input - The input to be validated.
       * @returns {boolean | string} - True if the input is valid, otherwise an error message.
       */
      validate: (input: string): boolean | string => {
        if (input.trim()) {
          if (/^[0-9a-fA-F]{64}$/.test(input.trim())) {
            return true
          } else return 'Input must be hexadecimal with a length of 64 characters (32 bytes or 256 bits).'
        } else return true // Allows empty input to use secure random keys.
      },
      suggestions: randomSharedKeys(32),
      when: (answers: Answers) => answers.LOCAL_DEFAULT_ENCRYPTION
    }
  ]

  console.info(chalk_info('It looks like the environment is missing or not appropriate,'))
  console.info(chalk_info(`This environment will be stored in ${path.win32.normalize(envPath)}\n`))

  inquirer.registerPrompt('suggest', require('inquirer-prompt-suggest'))
  const answers: NvllEnv = await inquirer.prompt<NvllEnv>(choices)
  Object.assign(Nvll.env, answers)
  saveConfig()
}

/**
 * @description Initializes the environment by prompting the user for input if the .env file does not exist,
 * otherwise loads the environment from the environment variables.
 * @returns {Promise<void>} A promise that resolves when the environment is initialized.
 */
const initializeConfig = async (): Promise<void> => {
  if (!existsSync(envPath) || !Nvll.env.BUCKET_NAME) {
    await promptEnvironments()
  } else await loadConfig()
  clear()
  console.error(chalk_error(`© ${new Date().getFullYear()} NVLL | https://nvll.me ------------\n`))
}

export { Nvll, loadConfig, initializeConfig, saveConfig, s3Client, kmsClient }
