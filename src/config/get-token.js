import { TokenNames } from './token-names.js'

export default async function getToken() {
  return (
    TokenNames.map((name) => process.env[name]).filter((token) => !!token)[0] ||
    null
  )
}
