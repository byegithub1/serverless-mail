import yargs from 'yargs/yargs'

import { hideBin } from 'yargs/helpers'
import { execSync } from 'child_process'

const DEFAULT_BREAKING_PATTERN =
  'BREAKING CHANGE|(?:feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)\\([^)]*\\)!:|(?:feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)!:'

const argv = yargs(hideBin(process.argv))
  .option('remote', {
    alias: 'r',
    type: 'string',
    description: 'Specify the remote repository'
  })
  .help().argv

const remote = argv.remote ? argv.remote : 'origin'
const breakingPattern = DEFAULT_BREAKING_PATTERN

const command = remote
  ? `auto-changelog --breaking-pattern "${breakingPattern}" -r "${remote}" && git add CHANGELOG.md`
  : `auto-changelog --breaking-pattern "${breakingPattern}" && git add CHANGELOG.md`

try {
  execSync(command, { stdio: 'inherit' })
} catch (error) {
  process.exit(1)
}
