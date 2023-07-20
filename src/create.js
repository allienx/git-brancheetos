import input from '@inquirer/input'
import select from '@inquirer/select'
import getConfig from './config/get-config.js'
import getNewVersion from './config/get-new-version.js'
import getPullRequestName from './config/get-pull-request-name.js'
import { PullRequestType } from './config/pull-request-type.js'
import GitProvider from './providers/git-provider.js'

export default async function create() {
  const config = await getConfig()
  const gitProvider = GitProvider.create(config)

  await gitProvider.init()

  const prType = await select({
    message: 'Select your pull request type',
    choices: [
      {
        name: `${config.devBranch} => ${config.stagingBranch}`,
        value: PullRequestType.DevToStaging,
        disabled: config.devBranch === config.stagingBranch,
      },
      {
        name: `${config.stagingBranch} => ${config.productionBranch}`,
        value: PullRequestType.StagingToProduction,
      },
      {
        name: `hotfix => ${config.productionBranch}`,
        value: PullRequestType.ProductionHotfix,
      },
    ],
  })

  const defaultNewVersion = getNewVersion({
    config,
    prType,
    latestVersion: gitProvider.latestVersion,
  })
  const newVersionName = await input({
    message: 'Enter the new version',
    default: defaultNewVersion,
    validate: (value) => !!value,
  })

  const defaultPrName = getPullRequestName({ prType, newVersionName })
  const prName = await input({
    message: 'Enter the pull request name',
    default: defaultPrName,
    validate: (value) => !!value,
  })

  const defaultReleaseBranchName = `release-${newVersionName}`
  const releaseBranchName =
    prType === PullRequestType.StagingToProduction ||
    prType === PullRequestType.ProductionHotfix
      ? await input({
          message: 'Enter the release branch name',
          default: defaultReleaseBranchName,
          validate: (value) => !!value,
        })
      : ''

  if (
    prType === PullRequestType.StagingToProduction ||
    prType === PullRequestType.ProductionHotfix
  ) {
    console.log(`Creating release branch...`)

    await gitProvider.createReleaseBranch({
      headBranchName:
        prType === PullRequestType.StagingToProduction
          ? config.stagingBranch
          : config.productionBranch,
      releaseBranchName,
    })

    console.log(`Created ${releaseBranchName} ✅`)
  }

  if (prType !== PullRequestType.ProductionHotfix) {
    const headBranchName =
      prType === PullRequestType.DevToStaging
        ? config.devBranch
        : releaseBranchName
    const baseBranchName =
      prType === PullRequestType.DevToStaging
        ? config.stagingBranch
        : config.productionBranch

    await gitProvider.createPullRequest({
      newVersionName,
      prName,
      headBranchName,
      baseBranchName,
    })
  } else {
    console.log('Skipping pull request creation for hotfix.')
  }
}
