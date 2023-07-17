#!/usr/bin/env node

import { Command } from 'commander'
import round from 'lodash/round.js'
import create from './src/create.js'
import resetConfig from './src/reset-config.js'

const start = Date.now()

let encounteredError = false

main()
  .catch((err) => {
    encounteredError = true

    console.error(err)
  })
  .finally(() => {
    const end = Date.now()
    const duration = round((end - start) / 1000, 2)

    console.log(`\n✨  Done ${duration}s.`)

    process.exit(encounteredError ? 1 : 0)
  })

async function main() {
  const program = new Command()

  program
    .name('brancheetos')
    .version('1.1.0')
    .description(
      'Automate your release pull requests. Enjoy your brancheetos 🌶️🧀',
    )

  program
    .command('create', { isDefault: true })
    .description('Prompt for inputs to create a pull request.')
    .action(async () => {
      await create()
    })

  program
    .command('reset-config')
    .description(
      'Reset the repo configuration values (use this to re-configure branch names).',
    )
    .action(async () => {
      await resetConfig()
    })

  await program.parseAsync(process.argv)
}
