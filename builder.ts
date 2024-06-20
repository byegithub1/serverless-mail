import type { BuildOutput } from 'bun'
import { chalk_error } from 'helpers/chalks'

const result: BuildOutput = await Bun.build({
  root: '.',
  entrypoints: ['index.ts'],
  outdir: 'dist',
  target: 'node',
  format: 'esm',
  sourcemap: 'external',
  publicPath: undefined
})

if (!result.success) {
  console.error(chalk_error('Build failed'))
  // Bun will pretty print the message object
  for (const message of result.logs) console.error(chalk_error(message))
}
