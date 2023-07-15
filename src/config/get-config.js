import envPaths from 'env-paths'
import gitRemoteOriginUrl from 'git-remote-origin-url'
import path from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

export default async function getConfig() {
  const gitRepo = await getGitRepo()

  let config = await readConfig(gitRepo)

  if (!config) {
    config = await writeConfig(gitRepo)
  }

  return config
}

async function getGitRepo() {
  const remoteOriginUrl = await gitRemoteOriginUrl()
  const regex = /(.*)@(.*):(.*)\/(.*)\.(.*)/g
  const matches = []

  let m

  while ((m = regex.exec(remoteOriginUrl)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++
    }

    m.forEach((match) => {
      matches.push(match)
    })
  }

  return {
    origin: matches[0],
    host: matches[2],
    owner: matches[3],
    repo: matches[4],
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

async function writeConfig(gitRepo) {
  const paths = envPaths('git-brancheetos')

  try {
    await mkdir(paths.config, { recursive: true })

    const configFilePath = path.join(
      paths.config,
      `${gitRepo.host}-${gitRepo.owner}-${gitRepo.repo}.json`,
    )
    const config = {
      path: configFilePath,
      devBranch: null,
      stagingBranch: null,
      productionBranch: null,
      gitRepo,
    }

    console.log(`Creating ${configFilePath}...`)

    await writeFile(configFilePath, JSON.stringify(config, null, 2), {
      encoding: 'utf8',
    })

    return config
  } catch (err) {
    return null
  }
}
