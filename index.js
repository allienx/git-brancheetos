import round from 'lodash/round.js'
import brancheetos from './src/brancheetos.js'

const start = Date.now()

main()
  .catch((err) => {
    console.error(err)
  })
  .finally(() => {
    const end = Date.now()
    const duration = round((end - start) / 1000, 2)

    console.log(`\n✨  Done ${duration}s.`)
  })

async function main() {
  await brancheetos()
}
