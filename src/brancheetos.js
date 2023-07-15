import GitProvider from './providers/git-provider.js'
import getConfig from './config/get-config.js'

export default async function brancheetos() {
  const config = await getConfig()
  const gitProvider = GitProvider.create(config)

  await gitProvider.init()

  console.log('continue...')
}
