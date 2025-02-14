import { PullRequestType } from './pull-request-type.js'

export default function getPullRequestName({ prType, newVersionName }) {
  switch (prType) {
    case PullRequestType.DevToStaging:
      return `Dev => Staging`

    case PullRequestType.StagingToProduction:
    case PullRequestType.ReleaseBranch:
      return `Release ${newVersionName} 🚀`

    default:
      return null
  }
}
