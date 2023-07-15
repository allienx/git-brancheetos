import getConfig from './config/get-config.js'

export default async function brancheetos() {
  const config = await getConfig()

  console.log(config)
}
