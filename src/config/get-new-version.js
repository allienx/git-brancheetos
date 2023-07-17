import { PullRequestType } from './pull-request-type.js'
import { VersionType } from './version-type.js'

export default function getNewVersion({ config, prType, latestVersion }) {
  if (!latestVersion) {
    return null
  }

  switch (config.versioningType) {
    case VersionType.SemVer:
      return getNewSemanticVersion({ latestVersion })

    case VersionType.YearMajorMinor:
      return getNewYearMajorMinorVersion({ prType, latestVersion })

    default:
      return null
  }
}

function getNewSemanticVersion({ latestVersion }) {
  let [major, minor, patch] = latestVersion.replace('v', '').split('.')

  if (!major || !minor || !patch) {
    return null
  }

  major = Number(major)
  minor = Number(minor)
  patch = Number(patch)

  const prefix = latestVersion.startsWith('v') ? 'v' : ''

  return `${prefix}${major}.${minor + 1}.${patch}`
}

function getNewYearMajorMinorVersion({ prType, latestVersion }) {
  let [year, major, minor] = latestVersion.replace('v', '').split('.')

  if (!year || !major || !minor) {
    return null
  }

  year = Number(year)
  major = Number(major)
  minor = Number(minor)

  const prefix = latestVersion.startsWith('v') ? 'v' : ''
  const currentYear = new Date().getFullYear()

  switch (prType) {
    case PullRequestType.DevToStaging:
    case PullRequestType.StagingToProduction: {
      if (year !== currentYear) {
        return `${prefix}${currentYear}.1.0`
      }

      return `${prefix}${year}.${major + 1}.0`
    }

    case PullRequestType.ProductionHotfix: {
      return `${prefix}${year}.${major}.${minor + 1}`
    }

    default:
      return null
  }
}
