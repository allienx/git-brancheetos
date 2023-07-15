export default function getTokenFromEnv(tokenNames) {
  const tokens = tokenNames
    .map((tokenName) => process.env[tokenName])
    .filter((tokenName) => !!tokenName)

  return tokens[0] || null
}
