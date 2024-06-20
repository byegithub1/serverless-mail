import chalk, { type ChalkInstance } from 'chalk'

const chalk_success: ChalkInstance = chalk.hex('#00ab41').bold.bgBlack
const chalk_info: ChalkInstance = chalk.hex('#1b7ced').bold.bgBlack
const chalk_error: ChalkInstance = chalk.hex('#c20000').bold.bgBlack

export { chalk_success, chalk_info, chalk_error }
