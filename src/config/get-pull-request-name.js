import { PullRequestType } from './pull-request-type.js'

export default function getPullRequestName({ prType, newVersionName }) {
  switch (prType) {
    case PullRequestType.DevToStaging:
      return `Code Freeze ${newVersionName} 🥶`

    case PullRequestType.StagingToProduction:
    case PullRequestType.ProductionHotfix:
      return `Release ${newVersionName} 🚀`

    default:
      return null
  }
}
