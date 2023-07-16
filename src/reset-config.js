import getConfig from './config/get-config.js'

export default async function resetConfig() {
  await getConfig({ forceReset: true })
}
