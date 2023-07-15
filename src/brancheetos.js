import { Octokit } from '@octokit/rest'
import getAuthenticatedUser from './config/get-authenticated-user.js'
import getConfig from './config/get-config.js'
import getToken from './config/get-token.js'
import { TokenNames } from './config/token-names.js'

export default async function brancheetos() {
  const token = await getToken()

  if (!token) {
    console.log(
      'No token detected. Please set one of the following environment variables in your shell:',
    )

    TokenNames.forEach((name) => {
      console.log(`  - ${name}`)
    })

    return
  }

  const octokit = new Octokit({
    auth: token,
    userAgent: 'git-brancheetos',
  })
  const user = await getAuthenticatedUser({ octokit })

  if (!user) {
    console.log('Could not load user details. Is your token expired?')

    return
  }

  const config = await getConfig()

  console.log(config)

  // const res = await octokit.rest.git.getRef({
  //   owner: config.gitRepo.owner,
  //   repo: config.gitRepo.repo,
  //   ref: 'heads/main',
  // })
  //
  // console.log(res.data)
}
