import input from '@inquirer/input'
import select from '@inquirer/select'
import envPaths from 'env-paths'
import gitRemoteOriginUrl from 'git-remote-origin-url'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { VersionType } from './version-type.js'

export default async function getConfig({ forceReset = false } = {}) {
  const gitRepo = await getGitRepo()

  let config = await readConfig(gitRepo)

  if (forceReset || !config) {
    config = await writeConfig({
      versioningType: null,
      devBranch: null,
      stagingBranch: null,
      productionBranch: null,
      gitRepo,
    })
  }

  if (
    !config.versioningType ||
    !config.devBranch ||
    !config.stagingBranch ||
    !config.productionBranch
  ) {
    config = await promptForMissingConfig(config)
  }

  return config
}

async function getGitRepo() {
  const remoteOriginUrl = await gitRemoteOriginUrl()

  const gitRegex =
    /^(?:git(?:\+[^:]+)?:\/\/|https:\/\/|git@)github\.com[/:](.+?)\/(.+?)(?:\.git)?$/
  const match = remoteOriginUrl.match(gitRegex)

  if (!match) {
    console.error('Invalid Git remote origin URL:', remoteOriginUrl)
    return null
  }

  const [, owner, repo] = match
  const protocol = remoteOriginUrl.startsWith('git@')
    ? 'ssh'
    : remoteOriginUrl.startsWith('git+ssh')
    ? 'git+ssh'
    : 'https'
  const host = 'github.com'

  return {
    protocol,
    origin: remoteOriginUrl,
    host,
    owner,
    repo,
  }
}

async function readConfig(gitRepo) {
  const paths = envPaths('git-brancheetos')
  const configFilePath = path.join(
    paths.config,
    `${gitRepo.host}-${gitRepo.owner}-${gitRepo.repo}.json`,
  )

  try {
    const config = await readFile(configFilePath, { encoding: 'utf8' })

    return JSON.parse(config)
  } catch (err) {
    return null
  }
}

async function writeConfig(config) {
  const { gitRepo } = config
  const paths = envPaths('git-brancheetos')

  try {
    await mkdir(paths.config, { recursive: true })

    const configFilePath = path.join(
      paths.config,
      `${gitRepo.host}-${gitRepo.owner}-${gitRepo.repo}.json`,
    )
    const newConfig = {
      path: configFilePath,
      ...config,
    }

    await writeFile(configFilePath, JSON.stringify(newConfig, null, 2), {
      encoding: 'utf8',
    })

    return newConfig
  } catch (err) {
    return null
  }
}

async function promptForMissingConfig(config) {
  const versioningType = await select({
    message: 'Select your versioning type',
    choices: [
      {
        name: `Semantic Versioning (${VersionType.SemVer})`,
        value: VersionType.SemVer,
        description: 'Example: v1.2.0 or v1.2.1',
      },
      {
        name: `Year.Major.Minor (${VersionType.YearMajorMinor})`,
        value: VersionType.YearMajorMinor,
        description: 'Example: v2023.15.0 or v2023.15.1',
      },
      {
        name: 'Other',
        value: VersionType.Other,
        description: 'Select this to always prompt for the new version name',
      },
    ],
  })

  const devBranch = await input({
    message: 'What is the name of your development branch?',
  })

  const stagingBranch = await input({
    message: 'What is the name of your staging branch?',
  })

  const productionBranch = await input({
    message: 'What is the name of your production branch?',
  })

  return await writeConfig({
    ...config,
    versioningType,
    devBranch,
    stagingBranch,
    productionBranch,
  })
}
