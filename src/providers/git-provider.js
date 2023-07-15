import GithubProvider from './github-provider.js'

export default class GitProvider {
  static create(config) {
    switch (config.gitRepo.host) {
      case 'github.com':
        return new GithubProvider(config)

      default:
        throw new Error(`Unsupported git host: ${config.gitRepo.host}`)
    }
  }
}
