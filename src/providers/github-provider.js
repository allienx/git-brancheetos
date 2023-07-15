import { Octokit } from '@octokit/rest'
import getTokenFromEnv from './get-token-from-env.js'

export default class GithubProvider {
  config
  tokenNames
  octokit

  constructor(config) {
    this.config = config
    this.tokenNames = ['GIT_BRANCHEETOS_TOKEN', 'GH_TOKEN', 'GITHUB_TOKEN']
    this.octokit = null
  }

  async init() {
    const token = getTokenFromEnv(this.tokenNames)

    if (!token) {
      let message =
        'No token detected. Please set one of the following environment variables in your shell:\n'

      this.tokenNames.forEach((name) => {
        message += `  - ${name}\n`
      })

      throw new Error(message)
    }

    this.octokit = new Octokit({
      auth: token,
      userAgent: 'git-brancheetos',
    })

    try {
      await this.octokit.users.getAuthenticated()
    } catch (err) {
      throw new Error(
        "Could not load user details. Check your token's expiration date.",
      )
    }
  }
}
