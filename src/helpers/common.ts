import os from 'os'

import { spawn } from 'child_process'

/**
 * @description Clears the console output based on the operating system.
 * @return {void}
 */
const clear = (): void => {
  switch (os.platform()) {
    case 'linux':
      process.stdout.write('\x1Bc')
      break
    case 'darwin':
      process.stdout.write('\x1B[2J\x1B[3J\x1B[H')
      break
    case 'win32':
      process.stdout.write('\x1B[2J\x1B[0f')
      break
    default:
      break
  }
}

/**
 * @description Generates a random readable string.
 * @param {number} length - The length of the string (must be a positive integer).
 * @returns {string} The generated string (a sequence of printable ASCII characters).
 */
const randomReadableString = (length: number): string => {
  const characters: string = '0123456789ABCDEF'
  let result: string = ''
  for (let i: number = 0; i < length; i++) result += characters[Math.floor(Math.random() * characters.length)]
  return Buffer.from(result, 'hex')
    .toString('utf-8')
    .replace(/[^\x20-\x7E]/g, '.') as string
}

/**
 * @description Opens a file in the default application for the platform.
 * @param {string} filePath - The path of the file to open.
 * @returns {Promise<void>} A promise that resolves when the file is opened.
 */
const openFile = async (filePath: string): Promise<void> => {
  const platform = os.platform()

  let command: string, args: string[]
  switch (platform) {
    case 'win32':
      command = 'cmd'
      args = ['/c', 'start', '', filePath]
      break
    case 'darwin':
      command = 'open'
      args = [filePath]
      break
    case 'linux':
      command = 'xdg-open'
      args = [filePath]
      break
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }

  const child = spawn(command, args, { stdio: 'inherit' })

  return new Promise<void>((resolve, reject) => {
    child.on('error', (err) => reject(new Error(`Error opening file: ${err}`)))
    child.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Child process exited with code ${code}`))
      } else {
        resolve()
      }
    })
  })
}

export { clear, randomReadableString, openFile }
