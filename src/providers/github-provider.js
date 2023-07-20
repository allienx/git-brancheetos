import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

export default class GithubProvider {
  config
  latestVersion

  constructor(config) {
    this.config = config
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

  async execGhApi(cmd) {
    try {
      const { stdout } = await execAsync(`gh api ${cmd}`)

      return JSON.parse(stdout)
    } catch (err) {
      return null
    }
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
      const user = await this.execGhApi('/user')

      return !!user?.id
    } catch (err) {
      return false
    }
  }

  async getLatestVersion() {
    const { gitRepo } = this.config

    try {
      const latestRelease = await this.execGhApi(
        `/repos/${gitRepo.owner}/${gitRepo.repo}/releases/latest`,
      )

      return latestRelease.tag_name
    } catch (err) {
      return null
    }
  }

  async createReleaseBranch({ headBranchName, releaseBranchName }) {
    const { gitRepo } = this.config

    const releaseBranchRef = await this.execGhApi(
      `/repos/${gitRepo.owner}/${gitRepo.repo}/git/ref/heads/${releaseBranchName}`,
    )

    // Don't try and create the release branch if it already exists.
    if (releaseBranchRef) {
      return
    }

    const ref = await this.execGhApi(
      `/repos/${gitRepo.owner}/${gitRepo.repo}/git/ref/heads/${headBranchName}`,
    )

    await this.execGhApi(
      [
        `/repos/${gitRepo.owner}/${gitRepo.repo}/git/refs`,
        '--method POST',
        `-f ref='refs/heads/${releaseBranchName}'`,
        `-f sha=${ref.object.sha}`,
      ].join(' '),
    )
  }

  async createPullRequest({
    newVersionName,
    prName,
    headBranchName,
    baseBranchName,
  }) {
    const { gitRepo } = this.config

    const milestones = await this.execGhApi(
      `/repos/${gitRepo.owner}/${gitRepo.repo}/milestones`,
    )
    const milestoneForVersion = milestones?.find((milestone) => {
      return milestone.title === newVersionName
    })

    const opts = [
      `--title "${prName}"`,
      `--head "${headBranchName}"`,
      `--base "${baseBranchName}"`,
      `--body ""`,
      milestoneForVersion ? `--milestone "${newVersionName}"` : '',
    ]
      .filter((opt) => !!opt)
      .join(' ')

    const { stdout } = await execAsync(`gh pr create ${opts}`)

    return {
      url: stdout.trim(),
    }
  }
}
