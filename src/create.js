import { input, select } from '@inquirer/prompts'
import getConfig from './config/get-config.js'
import getPullRequestName from './config/get-pull-request-name.js'
import getVersionOptions from './config/get-version-options.js'
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
        name: 'Create release branch',
        value: PullRequestType.ReleaseBranch,
      },
    ],
  })

  const versionOptions = getVersionOptions({
    config,
    latestVersion: gitProvider.latestVersion,
  })
  let newVersionName =
    prType !== PullRequestType.DevToStaging
      ? await select({
          message: 'Select the new version',
          choices: [
            ...versionOptions.map((option) => {
              return {
                name: option,
                value: option,
              }
            }),
            {
              name: 'Other',
              value: '__other__',
            },
          ],
        })
      : ''

  if (newVersionName === '__other__') {
    newVersionName = await input({
      message: 'Enter the new version',
      validate: (value) => !!value,
    })
  }

  const defaultPrName = getPullRequestName({ prType, newVersionName })
  const prName = await input({
    message: 'Enter the pull request name',
    default: defaultPrName,
    validate: (value) => !!value,
  })

  const defaultReleaseBranchName = `release-${newVersionName}`
  const releaseBranchName =
    prType === PullRequestType.StagingToProduction ||
    prType === PullRequestType.ReleaseBranch
      ? await input({
          message: 'Enter the release branch name',
          default: defaultReleaseBranchName,
          validate: (value) => !!value,
        })
      : ''

  if (
    prType === PullRequestType.StagingToProduction ||
    prType === PullRequestType.ReleaseBranch
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

  if (prType !== PullRequestType.ReleaseBranch) {
    console.log(`Creating pull request...`)

    const headBranchName =
      prType === PullRequestType.DevToStaging
        ? config.devBranch
        : releaseBranchName
    const baseBranchName =
      prType === PullRequestType.DevToStaging
        ? config.stagingBranch
        : config.productionBranch

    const { url } = await gitProvider.createPullRequest({
      newVersionName,
      prName,
      headBranchName,
      baseBranchName,
    })

    console.log(`Created ${prName}: ${url}`)
  } else {
    console.log('Skipping pull request creation for hotfix.')
  }
}
