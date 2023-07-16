import { Octokit } from '@octokit/rest'
import getTokenFromEnv from './get-token-from-env.js'

export default class GithubProvider {
  config
  tokenNames
  octokit
  latestVersion

  constructor(config) {
    this.config = config
    this.tokenNames = ['GIT_BRANCHEETOS_TOKEN', 'GH_TOKEN', 'GITHUB_TOKEN']
    this.octokit = null
    this.latestVersion = null
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

    this.latestVersion = await this.getLatestVersion()
    const { gitRepo } = this.config
    const pairs = [
      ['GitHub Repository:', `${gitRepo.owner}/${gitRepo.repo}`],
      ['Latest Version:', this.latestVersion || ''],
    ]

    console.log()
    pairs.forEach(([label, value]) => {
      console.log(`${label.padStart('18')} ${value}`)
    })
    console.log()
  }

  async getLatestVersion() {
    const { gitRepo } = this.config

    try {
      const { data: release } = await this.octokit.repos.getRelease({
        owner: gitRepo.owner,
        repo: gitRepo.repo,
        release_id: 'latest',
      })

      return release.tag_name
    } catch (err) {
      return null
    }
  }

  async createReleaseBranch({ headBranchName, releaseBranchName }) {
    const { gitRepo } = this.config

    const { data: ref } = await this.octokit.git.getRef({
      owner: gitRepo.owner,
      repo: gitRepo.repo,
      ref: `heads/${headBranchName}`,
    })

    await this.octokit.git.createRef({
      owner: gitRepo.owner,
      repo: gitRepo.repo,
      ref: `refs/heads/${releaseBranchName}`,
      sha: ref.object.sha,
    })
  }

  async createPullRequest({ prName, headBranchName, baseBranchName }) {
    const { gitRepo } = this.config

    const { data: pullRequest } = await this.octokit.pulls.create({
      owner: gitRepo.owner,
      repo: gitRepo.repo,
      title: prName,
      head: headBranchName,
      base: baseBranchName,
    })

    return {
      url: pullRequest.html_url,
    }
  }
}
