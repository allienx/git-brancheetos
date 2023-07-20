import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

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
    const hasGhCli = await this.hasGhCli()

    if (!hasGhCli) {
      throw new Error(
        'Missing GitHub CLI. See installation instructions: https://cli.github.com',
      )
    }

    const isAuthenticated = await this.isAuthenticated()

    if (!isAuthenticated) {
      throw new Error('GitHub CLI not authenticated. Run: gh auth login')
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

  async hasGhCli() {
    try {
      const { stdout } = await execAsync('gh version')

      return !!stdout.includes('gh version')
    } catch (err) {
      return false
    }
  }

  async isAuthenticated() {
    try {
      const { stdout } = await execAsync('gh api /user')
      const user = JSON.parse(stdout)

      return !!user?.id
    } catch (err) {
      console.error(err)

      return false
    }
  }

  async getLatestVersion() {
    const { gitRepo } = this.config

    try {
      const { stdout } = await execAsync(
        `gh api /repos/${gitRepo.owner}/${gitRepo.repo}/releases/latest`,
      )
      const latestRelease = JSON.parse(stdout)

      return latestRelease.tag_name
    } catch (err) {
      return null
    }
  }

  async createReleaseBranch({ headBranchName, releaseBranchName }) {
    const { gitRepo } = this.config

    const { stdout } = await execAsync(
      `gh api /repos/${gitRepo.owner}/${gitRepo.repo}/git/ref/heads/${headBranchName}`,
    )
    const ref = JSON.parse(stdout)

    const opts = [
      '--method POST',
      `-f ref='refs/heads/${releaseBranchName}'`,
      `-f sha=${ref.object.sha}`,
    ].join(' ')

    await execAsync(
      `gh api /repos/${gitRepo.owner}/${gitRepo.repo}/git/refs ${opts}`,
    )
  }

  async createPullRequest({
    newVersionName,
    prName,
    headBranchName,
    baseBranchName,
  }) {
    const opts = [
      `--title ${prName}`,
      `--head ${headBranchName}`,
      `--base ${baseBranchName}`,
      `--milestone ${newVersionName}`,
    ].join(' ')

    const { stdout } = await execAsync(`gh pr create ${opts}`)

    console.log(stdout)
  }
}
